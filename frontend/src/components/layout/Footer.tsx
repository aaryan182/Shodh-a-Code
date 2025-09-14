'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Github, Twitter, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2 mb-4"
            >
              <Code className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                CodeContest
              </span>
            </motion.div>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4 max-w-md">
              A modern platform for competitive programming contests. Challenge yourself,
              improve your skills, and compete with developers worldwide.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com"
                className="text-secondary-400 hover:text-primary-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://twitter.com"
                className="text-secondary-400 hover:text-primary-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:contact@codecontest.com"
                className="text-secondary-400 hover:text-primary-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/contests"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Contests
                </a>
              </li>
              <li>
                <a
                  href="/problems"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Problems
                </a>
              </li>
              <li>
                <a
                  href="/leaderboard"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Leaderboard
                </a>
              </li>
              <li>
                <a
                  href="/tutorials"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Tutorials
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/help"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/docs"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              © 2024 CodeContest. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/terms"
                className="text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
