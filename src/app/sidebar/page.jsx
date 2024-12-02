'use client'

import React, { useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'


const Sidebar = () => {

    const [isOpen, setIsOpen] = useState(false)

    const sidebarVariants = {
        open: {
            x: 0,
            width: '100%',
            height: '100%',
            transition: {
                type: 'tween',
                stiffness: 300,
                damping: 30
            }
        },
        closed: {
            x: 0,
            width: '50%',
            height: 'calc(100vh - 100px)',
            transition: {
                type: 'tween',
                stiffness: 300,
                damping: 30
            }
        }
    }

    const contentVariants = {
        open: {
            opacity: 1,
            x: 0,
            transition: { delay: 0.2, duration: 0.3 }
        },
        closed: {
            opacity: 0,
            x: '50%',
            transition: { duration: 0.3 }
        }
    }

    return (
        <div className="relative h-screen overflow-hidden bg-gray-600">
            <AnimatePresence>
                <motion.div 
                    className={`fixed overflow-visible p-2 bg-white shadow-lg ${isOpen ? "" : "rounded-l-2xl"}`}
                    initial="closed"
                    animate={isOpen ? "open" : "closed"}
                    variants={sidebarVariants}
                    style={{ top: '50%', right: 0, translateY: '-50%' }}
                >
                    <motion.button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="z-10 "
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-gray-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-600" />
                        )}
                    </motion.button>
                    <div 
                        className="overflow-hidden content" // Allow overflow
                        style={{ maxHeight: '100%', position: 'relative' }} // Ensure no clipping
                    >
                        
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default Sidebar
