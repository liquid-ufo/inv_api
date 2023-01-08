const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    experience: {
        type: String
    },
    skills: {
        type: [String]
    },
    education: {
        type: String
    },
    noticePeriod: {
        type: String
    },
    type: {
        type: String
    },
    location: {
        type: String
    },
    company: {
        type: String
    },
    salary: {
        type: String,
    },
    noOfOpenings: {
        type: String
    },
    contactName: {
        type: String
    },
    contactEmail: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Job = mongoose.model('job', JobSchema);