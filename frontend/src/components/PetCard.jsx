// components/PetCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PetCard = ({ pet, showArrow = false }) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="bg-white rounded-xl overflow-hidden shadow-md cursor-pointer z-10"
      onClick={() => navigate(`/pet/${pet.id}`)}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="h-48 overflow-hidden">
        <img
          src={
            pet.photos?.[0]?.id
              ? `http://localhost:5000/api/pets/photos/${pet.photos[0].id}`
              : '/images/pet-placeholder.png'
          }
          alt={`${pet.name} - ${pet.breed}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/images/pet-placeholder.png';
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">{pet.name}</h3>
          <span className={`text-sm ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
            {pet.gender === 'male' ? '♂' : '♀'} {pet.gender}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{pet.age_category}</span>
          <span>{pet.breed}</span>
        </div>
        {showArrow && (
          <div className="mt-4 flex justify-end">
            <ArrowRight className="h-5 w-5 text-teal-700"/>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PetCard;