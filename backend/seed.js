import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from './models/Video.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/videostream';

const sampleVideos = [
  {
    title: "Adventures of Bunny: The Meadow Escape",
    description: "Witness the stunning visual journey of a giant, gentle rabbit whose daily routine gets turned upside down when a gang of small forest creatures tries to disrupt his peace. An animation masterclass.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    views: 45209,
    engagementScore: 92,
    creator: {
      name: "Blender Foundation",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    duration: "9:56"
  },
  {
    title: "Synthesizing the Machine Mind",
    description: "Explore the frontiers of artificial intelligence and machine learning as experts detail the deep neural network structures that power modern neural synthesis.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    category: "Tech",
    views: 120530,
    engagementScore: 98,
    creator: {
      name: "Cybernetics Lab",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    duration: "10:53"
  },
  {
    title: "Cyberpunk Chronicles: Tears of Steel",
    description: "A dystopian sci-fi story set in an alternate future Amsterdam, where a group of cybernetic fighters attempt to rescue the city from giant robotic spiders.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80",
    category: "Tech",
    views: 89412,
    engagementScore: 85,
    creator: {
      name: "Blender Studios",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    duration: "12:14"
  },
  {
    title: "Retro Synthwave Sunset Session",
    description: "Chill out with this high-energy synthwave visualizer. Perfect for late-night programming sessions, driving, or just relaxing with lo-fi electronic frequencies.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80",
    category: "Music",
    views: 243900,
    engagementScore: 99,
    creator: {
      name: "Neon Rider",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:15"
  },
  {
    title: "Apex Legends Speedrun Mechanics",
    description: "A breakdown of physics exploits, slide-jumping, and momentum vectors that allow professional speedrunners to cross massive maps in seconds.",
    videoUrl: "https://commondatachannel.blogspot.com" !== "" ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" : "",
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    category: "Gaming",
    views: 18902,
    engagementScore: 78,
    creator: {
      name: "Glitch Hunter",
      avatarUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:15"
  },
  {
    title: "Off-Road Bullrun: Mud & Mountains",
    description: "Get dirty with a high-octane 4x4 racing expedition through the muddy peaks of the Rocky Mountains. Filmed in glorious 4K resolution.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    views: 7421,
    engagementScore: 61,
    creator: {
      name: "Wild Trails",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:59"
  },
  {
    title: "Urban Cruise: Testing the AWD Outback",
    description: "We take the new AWD crossover vehicle out onto both wet city streets and dusty dirt trails to see if it lives up to the adventure branding.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    views: 9283,
    engagementScore: 70,
    creator: {
      name: "Traction Weekly",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"
    },
    duration: "9:54"
  },
  {
    title: "Building a React Web Application from Scratch",
    description: "A step-by-step masterclass demonstrating modern React patterns, styling systems, Tailwind integrations, and custom state management architecture.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    category: "Tech",
    views: 189400,
    engagementScore: 97,
    creator: {
      name: "Antigravity Dev",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:15"
  },
  {
    title: "Sub-Zero Alpine Survival Guide",
    description: "Deep in the sub-zero peaks of the Alps, we learn how to locate shelter, identify edible vegetation, and spark a campfire in freezing rain conditions.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    views: 31200,
    engagementScore: 89,
    creator: {
      name: "Wild Trails",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:15"
  },
  {
    title: "Electronic Beats & Visualizer Session",
    description: "A visually striking electronic chill session featuring custom digital animation overlays synced with high-fidelity, relaxing synthesizer waves.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    category: "Music",
    views: 301290,
    engagementScore: 99,
    creator: {
      name: "Synth Master",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"
    },
    duration: "0:15"
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB Compass:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    console.log("Clearing existing video records...");
    await Video.deleteMany({});

    console.log("Inserting new seed video records...");
    const inserted = await Video.insertMany(sampleVideos);
    console.log(`Successfully seeded ${inserted.length} videos!`);

    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
}

seed();
