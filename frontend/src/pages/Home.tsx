import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Phone, Database, MessageSquare } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickStart = (number: string) => {
    if (number) {
      navigate(`/chat?phone=${encodeURIComponent(number)}`);
    } else {
      navigate('/chat');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
            <MessageSquare className="w-8 h-8 text-[#fb923c]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pharmesol Sales Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered conversations for inbound pharmacy sales
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Directory Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Pharmacy Directory</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Browse and search our complete pharmacy database
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Features:</div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#fb923c] rounded-full mr-2"></span>
                    Search and filter pharmacies
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#fb923c] rounded-full mr-2"></span>
                    View prescription volumes
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#fb923c] rounded-full mr-2"></span>
                    Sort by any column
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#fb923c] rounded-full mr-2"></span>
                    Access contact information
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => navigate('/directory')}
                variant="outline"
                className="w-full border-2 border-[#fb923c] text-[#fb923c] hover:bg-orange-50"
              >
                View Directory →
              </Button>
            </div>
          </div>

          {/* Start Conversation Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <Phone className="w-5 h-5 text-[#fb923c]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Start a Conversation</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/directory')}
                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-[#fb923c] hover:bg-orange-50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-[#fb923c] transition-colors">
                      Choose a Pharmacy
                    </div>
                    <div className="text-sm text-gray-500">
                      Simulate a call with an existing Pharmacy from our{' '}
                      <span className="text-[#fb923c] font-medium underline">
                        Directory
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-[#fb923c] transition-colors">
                    →
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleQuickStart('')}
                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-[#fb923c] hover:bg-orange-50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-[#fb923c] transition-colors">
                      Custom Number
                    </div>
                    <div className="text-sm text-gray-500">Enter your own</div>
                  </div>
                  <div className="text-gray-400 group-hover:text-[#fb923c] transition-colors">
                    →
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
