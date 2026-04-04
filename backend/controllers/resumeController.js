const ResumeAnalysis = require('../models/ResumeAnalysis');
const multer = require('multer');
const pdf = require('pdf-parse');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const skillDatabase = {
  'Software Engineer': ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'git', 'docker', 'aws', 'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'rest api', 'ci/cd', 'agile', 'microservices', 'kubernetes', 'linux'],
  'Data Scientist': ['python', 'r', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'statistics', 'data visualization', 'sql', 'big data', 'hadoop', 'spark', 'tableau', 'excel', 'natural language processing', 'computer vision', 'a/b testing'],
  'Frontend Developer': ['javascript', 'react', 'angular', 'vue', 'typescript', 'html', 'css', 'sass', 'bootstrap', 'tailwind', 'redux', 'context api', 'webpack', 'vite', 'responsive design', 'accessibility', 'performance optimization', 'unit testing', 'jest', 'cypress'],
  'Backend Developer': ['node.js', 'python', 'java', 'c#', 'express', 'django', 'spring boot', 'sql', 'mongodb', 'postgresql', 'redis', 'graphql', 'rest api', 'microservices', 'docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'security'],
  'DevOps Engineer': ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'linux', 'shell scripting', 'python', 'git', 'monitoring', 'logging', 'security', 'infrastructure as code', 'containerization', 'microservices', 'agile'],
  'Full Stack Developer': ['javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'sql', 'mongodb', 'postgresql', 'rest api', 'graphql', 'docker', 'git', 'html', 'css', 'agile', 'aws', 'redux', 'express', 'django']
};

exports.uploadResume = upload.single('resume');

exports.analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file'
      });
    }

    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: 'Please provide target role'
      });
    }

    const dataBuffer = req.file.buffer;
    const data = await pdf(dataBuffer);

    const extractedText = (data.text || '').toLowerCase();

    const requiredSkills =
      skillDatabase[targetRole] || skillDatabase['Software Engineer'];

    const identifiedSkills = requiredSkills.filter(skill =>
      extractedText.includes(skill.toLowerCase())
    );

    const missingSkills = requiredSkills.filter(skill =>
      !extractedText.includes(skill.toLowerCase())
    );

    const matchPercentage =
      requiredSkills.length > 0
        ? Math.round((identifiedSkills.length / requiredSkills.length) * 100)
        : 0;

    const recommendations = generateRecommendations(
      identifiedSkills,
      missingSkills,
      targetRole
    );

    const analysis = await ResumeAnalysis.create({
      user: req.user.id,
      fileName: req.file.originalname,
      extractedText: data.text,
      identifiedSkills,
      targetRole,
      requiredSkills,
      matchPercentage,
      missingSkills: missingSkills.slice(0, 10),
      recommendations
    });

    res.status(201).json({
      success: true,
      data: {
        fileName: analysis.fileName,
        targetRole: analysis.targetRole,
        identifiedSkills: analysis.identifiedSkills,
        requiredSkills: analysis.requiredSkills,
        matchPercentage: analysis.matchPercentage,
        missingSkills: analysis.missingSkills,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyAnalyses = async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    if (
      analysis.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this analysis'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
};

function generateRecommendations(identifiedSkills, missingSkills, targetRole) {
  const recommendations = [];

  if (missingSkills.length > 0) {
    recommendations.push(
      `Focus on learning: ${missingSkills.slice(0, 5).join(', ')}`
    );
  }

  if (identifiedSkills.length < 5) {
    recommendations.push(
      'Add more technical skills relevant to your target role'
    );
  }

  recommendations.push(
    'Ensure your resume highlights projects where you used these skills'
  );

  recommendations.push(
    'Include quantifiable achievements for each skill'
  );

  const softSkills = [
    'communication',
    'leadership',
    'problem-solving',
    'teamwork',
    'time management'
  ];

  const hasSoftSkills = softSkills.some(ss =>
    identifiedSkills.includes(ss)
  );

  if (!hasSoftSkills) {
    recommendations.push(
      'Consider adding soft skills like communication and teamwork'
    );
  }

  return recommendations;
}

exports.getSkillDatabase = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: Object.keys(skillDatabase)
    });
  } catch (err) {
    next(err);
  }
};