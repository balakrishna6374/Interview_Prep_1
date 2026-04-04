const ApiRequest = require('../models/ApiRequest');

const trackApiRequest = async (req, res, next) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  let tracked = false;
  
  res.send = function(body) {
    if (tracked) {
      return originalSend.call(this, body);
    }
    tracked = true;
    
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
      setImmediate(async () => {
        try {
          let interviewType = null;
          const endpoint = req.originalUrl || req.url;
          
          if (endpoint.includes('mock-interview')) {
            interviewType = 'general';
          } else if (endpoint.includes('resume-mock-interview') || endpoint.includes('extract-skills')) {
            interviewType = 'resume';
          } else if (endpoint.includes('job-description-interview')) {
            interviewType = 'job';
          }
          
          await ApiRequest.create({
            endpoint: endpoint,
            method: req.method,
            userId: req.user?._id || null,
            statusCode: statusCode,
            responseTime: responseTime,
            interviewType: interviewType
          });
        } catch (err) {
          console.error('Error tracking API request:', err.message);
        }
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

const getApiStats = async (startDate, endDate) => {
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  try {
    const stats = await ApiRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          successfulRequests: {
            $sum: { $cond: [{ $lt: ['$statusCode', 400] }, 1, 0] }
          },
          failedRequests: {
            $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
          }
        }
      }
    ]);
    
    const requestsByEndpoint = await ApiRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { endpoint: '$endpoint', method: '$method' },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const requestsByInterviewType = await ApiRequest.aggregate([
      { $match: { ...matchStage, interviewType: { $ne: null } } },
      {
        $group: {
          _id: '$interviewType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const requestsByDay = await ApiRequest.aggregate([
      { 
        $match: { 
          ...matchStage,
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return {
      totalRequests: stats[0]?.totalRequests || 0,
      avgResponseTime: Math.round(stats[0]?.avgResponseTime || 0),
      successfulRequests: stats[0]?.successfulRequests || 0,
      failedRequests: stats[0]?.failedRequests || 0,
      requestsByEndpoint: requestsByEndpoint.map(r => ({
        endpoint: r._id.endpoint,
        method: r._id.method,
        count: r.count,
        avgResponseTime: Math.round(r.avgResponseTime)
      })),
      requestsByInterviewType: requestsByInterviewType.map(r => ({
        type: r._id,
        count: r.count
      })),
      requestsByDay: requestsByDay.map(r => ({
        date: r._id,
        count: r.count
      }))
    };
  } catch (error) {
    console.error('Error getting API stats:', error);
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      successfulRequests: 0,
      failedRequests: 0,
      requestsByEndpoint: [],
      requestsByInterviewType: [],
      requestsByDay: []
    };
  }
};

module.exports = { trackApiRequest, getApiStats };
