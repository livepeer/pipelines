'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { HeaderSection } from '@/components/home/HeaderSection';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { CloudBackground } from '@/components/home/CloudBackground';

// Featured experiences with specified links
const featuredExperiences = [
  {
    id: 1,
    title: 'Dreamshaper',
    description: 'Create stunning AI-generated images',
    image: '/placeholder-featured-1.jpg',
    link: '/create',
  },
  {
    id: 2,
    title: 'Liveportrait',
    description: 'Transform your photos into portraits',
    image: '/placeholder-featured-2.jpg',
    link: '/create?pipeline_id=pip_00527Gdb247b202591d-portrait-standard',
  },
];

// Community experiences with random prompts
const communityExperiences = [
  {
    id: 1,
    title: 'Cubist Dreams',
    description: 'Geometric abstraction meets modern art',
    prompt: '((cubism)) tesseract ((flat colors)) --creativity 0.6 --quality 3',
    image: '/placeholder-community-1.jpg',
  },
  {
    id: 2,
    title: 'Neon Nights',
    description: 'Cyberpunk-inspired digital art',
    prompt: '((neon)) cityscape ((cyberpunk)) --creativity 0.7 --quality 3',
    image: '/placeholder-community-2.jpg',
  },
  {
    id: 3,
    title: 'Abstract Flow',
    description: 'Fluid dynamics in motion',
    prompt: '((abstract)) fluid motion ((dynamic)) --creativity 0.8 --quality 3',
    image: '/placeholder-community-3.jpg',
  },
  {
    id: 4,
    title: 'Digital Dreams',
    description: 'Surreal digital landscapes',
    prompt: '((surreal)) landscape ((digital art)) --creativity 0.75 --quality 3',
    image: '/placeholder-community-4.jpg',
  },
  {
    id: 5,
    title: 'Minimalist Magic',
    description: 'Clean lines and simple beauty',
    prompt: '((minimalist)) design ((geometric)) --creativity 0.65 --quality 3',
    image: '/placeholder-community-5.jpg',
  },
  {
    id: 6,
    title: 'Cosmic Journey',
    description: 'Space exploration through art',
    prompt: '((space)) nebula ((cosmic)) --creativity 0.85 --quality 3',
    image: '/placeholder-community-6.jpg',
  },
  {
    id: 7,
    title: 'Nature\'s Palette',
    description: 'Organic forms and natural beauty',
    prompt: '((organic)) nature ((vibrant)) --creativity 0.7 --quality 3',
    image: '/placeholder-community-7.jpg',
  },
  {
    id: 8,
    title: 'Urban Dreams',
    description: 'City life reimagined',
    prompt: '((urban)) architecture ((modern)) --creativity 0.75 --quality 3',
    image: '/placeholder-community-8.jpg',
  },
  {
    id: 9,
    title: 'Fantasy Realms',
    description: 'Magical worlds come to life',
    prompt: '((fantasy)) castle ((magical)) --creativity 0.8 --quality 3',
    image: '/placeholder-community-9.jpg',
  },
  {
    id: 10,
    title: 'Future Visions',
    description: 'Tomorrow\'s world today',
    prompt: '((futuristic)) technology ((sci-fi)) --creativity 0.7 --quality 3',
    image: '/placeholder-community-10.jpg',
  },
];

interface CommunityExperience {
  id: number;
  title: string;
  description: string;
  prompt: string;
  image: string;
  og_image?: string;
  share_link: string;
}

export default function GalleryPage() {
  const [communityExperiences, setCommunityExperiences] = useState<CommunityExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetch('/api/experiences/publish');
        if (!response.ok) {
          throw new Error('Failed to fetch experiences');
        }
        const experiences = await response.json();
        // If no experiences are stored, use the sample experiences
        setCommunityExperiences(experiences.length > 0 ? experiences : communityExperiences);
      } catch (error) {
        console.error('Error fetching experiences:', error);
        // On error, show sample experiences
        setCommunityExperiences(communityExperiences);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  const handleTryCameraClick = () => {
    window.location.href = '/create';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-24 py-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <CloudBackground animationStarted={true} getCloudTransform={() => ''} />
        </div>
        <div className="relative z-10">
          <HeaderSection onTryCameraClick={handleTryCameraClick} onlyDiscord />
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-24 py-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <CloudBackground animationStarted={true} getCloudTransform={() => ''} />
      </div>
      <div className="relative z-10">
        <HeaderSection onTryCameraClick={handleTryCameraClick} onlyDiscord />
        
        {/* Mini Hero Section */}
        <section className="pt-64 max-w-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to your launchpad for live AI experiences </h1>
              <p className="text-xl text-gray-600">Explore community creations and create your own immersive world</p>
            </div>
            <div className="relative group">
              <button
                onClick={() => window.location.href = '/create'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                Create an Experience
                <InformationCircleIcon className="h-5 w-5" />
              </button>
              <div className="absolute right-0 mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Create your own Live AI experience with our easy-to-use tools. Customize prompts, styles, and more to bring your vision to life.
              </div>
            </div>
          </div>
        </section>

        {/* Featured Experiences Grid */}
        <section className="py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Experiences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
            {featuredExperiences.map((experience) => (
              <Link
                key={experience.id}
                href={experience.link}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={experience.image}
                    alt={experience.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{experience.title}</h3>
                  <p className="text-gray-600">{experience.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Community Experiences Grid */}
        <section className="py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Community Experiences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
            {communityExperiences.map((experience) => (
              <Link
                key={experience.id}
                href={experience.share_link}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48">
                  {experience.image.startsWith('http') ? (
                    experience.og_image ? (
                      <img
                        src={experience.og_image}
                        alt={experience.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={experience.image}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <img
                      src={experience.image}
                      alt={experience.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{experience.title}</h3>
                  <p className="text-gray-600 mb-4">{experience.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 