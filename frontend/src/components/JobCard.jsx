import React from 'react';
import { MapPin, Building, ExternalLink, PenTool } from 'lucide-react';
import { Button } from './Button';

export const JobCard = ({ job, onTailor, isTailoring }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Building className="w-4 h-4" />
                        <span>{job.company}</span>
                        <MapPin className="w-4 h-4 ml-2" />
                        <span>{job.location}</span>
                    </div>
                </div>
                <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
            </div>

            <p className="mt-4 text-gray-600 line-clamp-3 text-sm">
                {job.description}
            </p>

            <div className="mt-4 flex justify-end">
                <Button
                    onClick={() => onTailor(job)}
                    loading={isTailoring}
                    variant="outline"
                    className="text-sm"
                >
                    <PenTool className="w-4 h-4" />
                    Tailor Resume
                </Button>
            </div>
        </div>
    );
};
