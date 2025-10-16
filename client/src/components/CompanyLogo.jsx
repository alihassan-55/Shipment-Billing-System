import React from 'react';

const CompanyLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "h-8 w-8",
    default: "h-12 w-12", 
    large: "h-16 w-16"
  };

  return (
    <div className={`flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg ${sizeClasses[size]} ${className}`}>
      <span className="text-sm font-bold">CE</span>
    </div>
  );
};

export default CompanyLogo;

