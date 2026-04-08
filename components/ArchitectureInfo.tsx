import React from 'react';
import { ARCHITECTURE_CONTENT } from '../constants';

// Simple markdown-like renderer for the content
export const ArchitectureInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="prose prose-blue max-w-none">
        {ARCHITECTURE_CONTENT.split('\n').map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-xl font-bold text-gray-800 mt-8 mb-4">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('**')) {
            // Very simple bold parsing for the demo
            return <p key={idx} className="mb-2 text-gray-800 font-semibold">{line.replace(/\*\*/g, '')}</p>;
          }
          if (line.startsWith('* ')) {
            return (
              <ul key={idx} className="list-disc list-inside ml-4 mb-2">
                <li className="text-gray-700">{line.replace('* ', '')}</li>
              </ul>
            );
          }
          if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
             return <p key={idx} className="mb-2 text-gray-700 ml-4 font-medium">{line}</p>
          }
          if (line.trim() === '') return <br key={idx} />;
          
          return <p key={idx} className="text-gray-600 mb-2 leading-relaxed">{line}</p>;
        })}
      </div>
    </div>
  );
};