'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { portfolioProjects as seedPortfolioProjects } from '@/shared/data/portfolio';

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  year: number;
  paints: string[];
};

export default function PortfolioPage() {
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(() =>
    seedPortfolioProjects.map((project) => ({
      id: String(project.id),
      title: project.title,
      description: project.description,
      category: project.category,
      image: project.image ?? '',
      year: project.year,
      paints: project.paints,
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPortfolio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/portfolio', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load portfolio');
        }

        if (isMounted) {
          const projects = Array.isArray(data.projects) ? data.projects : [];
          if (projects.length > 0) {
            setPortfolioProjects(projects);
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load portfolio');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPortfolio();

    return () => {
      isMounted = false;
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Work</h1>
          <p className="text-xl text-gray-600">
            Explore our portfolio of completed projects showcasing the quality and versatility of ColorBurst paints
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {isLoading && (
            <div className="col-span-full text-center text-gray-500 text-sm">Refreshing latest projects...</div>
          )}
          {!isLoading && errorMessage && (
            <div className="col-span-full text-center text-red-600">{errorMessage}</div>
          )}
          {portfolioProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 border border-gray-100"
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <Image
                  src={project.image || '/portfolio/new-project.svg'}
                  alt={`${project.title} project image`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                  {project.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition">{project.title}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>

                <div className="space-y-3 pt-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Paints Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.paints.map((paint, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 text-xs px-3 py-1 rounded-full border border-blue-200 font-medium"
                      >
                        {paint}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <motion.div
                  className="flex justify-between items-center text-sm text-gray-600 pt-4 border-t border-gray-200"
                  whileHover={{ color: '#1e3a8a' }}
                >
                  <span className="font-semibold">{project.category}</span>
                  <span className="font-bold text-lg">{project.year}</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
          {!isLoading && !errorMessage && portfolioProjects.length === 0 && (
            <div className="col-span-full text-center text-gray-600">No portfolio projects available yet.</div>
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 text-white py-16 rounded-xl shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: portfolioProjects.length + '+', label: 'Projects Completed' },
              { number: '98%', label: 'Client Satisfaction' },
              { number: '15+', label: 'Years of Excellence' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl font-bold mb-2"
                >
                  {stat.number}
                </motion.p>
                <p className="text-lg text-gray-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

