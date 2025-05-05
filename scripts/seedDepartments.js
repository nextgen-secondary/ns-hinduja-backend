import mongoose from 'mongoose';
import dotenv from 'dotenv';
import departmentModel from '../models/departmentModel.js';

dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Sample department data
const departments = [
  {
    name: 'Cardiology',
    description: 'Heart and cardiovascular system specialists',
    averageWaitTime: 20,
    currentQueueSize: 5,
    location: 'Building A, Floor 2',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
  },
  {
    name: 'Neurology',
    description: 'Brain, spinal cord and nervous system specialists',
    averageWaitTime: 30,
    currentQueueSize: 8,
    location: 'Building B, Floor 3',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
  },
  {
    name: 'Orthopedics',
    description: 'Bone and joint specialists',
    averageWaitTime: 25,
    currentQueueSize: 6,
    location: 'Building A, Floor 1',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
  },
  {
    name: 'Pediatrics',
    description: 'Child healthcare specialists',
    averageWaitTime: 15,
    currentQueueSize: 4,
    location: 'Building C, Floor 1',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
  },
  {
    name: 'Dermatology',
    description: 'Skin specialists',
    averageWaitTime: 20,
    currentQueueSize: 3,
    location: 'Building B, Floor 2',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
  }
];

// Function to seed departments
async function seedDepartments() {
  try {
    // Clear existing departments
    await departmentModel.deleteMany({});
    console.log('Cleared existing departments');
    
    // Insert new departments
    const result = await departmentModel.insertMany(departments);
    console.log(`Added ${result.length} departments`);
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedDepartments();