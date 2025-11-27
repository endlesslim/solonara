import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { UserTraits } from '../types';

interface Props {
  traits: UserTraits;
}

const TraitRadar: React.FC<Props> = ({ traits }) => {
  const data = [
    { subject: '직진력(Aggro)', A: traits.aggressiveness, fullMark: 50 },
    { subject: '공감력(Empathy)', A: traits.empathy, fullMark: 50 },
    { subject: '현실감(Realism)', A: traits.realism, fullMark: 50 },
    { subject: '예능감(Humor)', A: traits.humor, fullMark: 50 },
    { subject: '자기애(Style)', A: traits.style, fullMark: 50 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 50]} tick={false} axisLine={false} />
          <Radar
            name="My Traits"
            dataKey="A"
            stroke="#ec4899"
            strokeWidth={3}
            fill="#fbcfe8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TraitRadar;