import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface Visualization {
  name: string;
  type: string;
  description: string;
  filename: string;
  content: string;
  code: string;
  timestamp: string;
  visualization_type?: 'vega-lite' | 'plotly' | 'matplotlib' | 'manual';
  spec?: any; // Vega-Lite specification
  data?: any; // Plotly data
  layout?: any; // Plotly layout
}

interface ImagesTabProps {
  projectId: string;
  images: Visualization[];
  onImagesUpdate: (images: Visualization[]) => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ projectId, images, onImagesUpdate }) => {
  const [newImageName, setNewImageName] = useState('');
  const [newImageData, setNewImageData] = useState('');
  const [newVisualizationType, setNewVisualizationType] = useState<'vega-lite' | 'plotly' | 'manual'>('vega-lite');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<Visualization | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Dynamic imports for visualization libraries
  const [_vegaEmbed, _setVegaEmbed] = useState<any>(null);
  const [_Plotly, _setPlotly] = useState<any>(null);

  useEffect(() => {
    // Temporarily disabled visualization libraries to fix build issues
    // TODO: Re-enable when dependency issues are resolved
    /*
    // Load Vega-Lite
    import('vega-embed').then((module) => {
      setVegaEmbed(module.default);
    }).catch(console.error);

    // Load Plotly
    import('plotly.js-dist').then((module) => {
      setPlotly(module);
    }).catch(console.error);
    */
  }, []);

  const createImage = async () => {
    if (!newImageName.trim() || !newImageData.trim()) {
      alert('Please enter both image name and data');
      return;
    }

    try {
      setLoading(true);
      
      let parsedContent = newImageData;
      // let _visualizationType = newVisualizationType;
      let spec = null;
      let data = null;
      let layout = null;

      // Parse the content based on visualization type
      if (newVisualizationType === 'vega-lite') {
        try {
          spec = JSON.parse(newImageData);
          parsedContent = JSON.stringify(spec, null, 2);
        } catch (e) {
          alert('Invalid Vega-Lite specification. Please provide valid JSON.');
          return;
        }
      } else if (newVisualizationType === 'plotly') {
        try {
          const plotlyData = JSON.parse(newImageData);
          if (plotlyData.data && plotlyData.layout) {
            data = plotlyData.data;
            layout = plotlyData.layout;
            parsedContent = newImageData;
          } else {
            alert('Invalid Plotly specification. Please provide valid JSON with data and layout.');
            return;
          }
        } catch (e) {
          alert('Invalid Plotly specification. Please provide valid JSON.');
          return;
        }
      }

      const newVisualization: Visualization = {
        name: newImageName,
        type: newVisualizationType,
        description: `Interactive ${newVisualizationType} visualization`,
        filename: newImageName,
        content: parsedContent,
        code: '',
        timestamp: new Date().toISOString(),
        visualization_type: newVisualizationType,
        spec,
        data,
        layout
      };
      
      await apiService.saveFile({
        project_id: projectId,
        filename: newImageName,
        content: parsedContent,
        file_type: 'visualization',
      });
      
      onImagesUpdate([...images, newVisualization]);
      setNewImageName('');
      setNewImageData('');
      setNewVisualizationType('vega-lite');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create visualization:', error);
      alert('Failed to create visualization');
    } finally {
      setLoading(false);
    }
  };

  // const renderVegaLiteChart = (_spec: any, _containerId: string) => {
  //   // Temporarily disabled
  //   console.log('Vega-Lite rendering disabled for now');
  // };

  // const renderPlotlyChart = (_data: any, _layout: any, _containerId: string) => {
  //   // Temporarily disabled
  //   console.log('Plotly rendering disabled for now');
  // };

  const renderVisualization = (visualization: Visualization) => {
    const containerId = `viz-${visualization.name.replace(/\s+/g, '-')}`;
    
    if (visualization.visualization_type === 'vega-lite' && visualization.spec) {
      return (
        <div className="bg-white rounded-lg p-4 border">
          <div id={containerId} className="w-full h-64"></div>
          <div className="text-gray-400 text-center mt-2">
            <p>Vega-Lite visualization preview</p>
          </div>
        </div>
      );
    } else if (visualization.visualization_type === 'plotly' && visualization.data && visualization.layout) {
      return (
        <div className="bg-white rounded-lg p-4 border">
          <div id={containerId} className="w-full h-64"></div>
          <div className="text-gray-400 text-center mt-2">
            <p>Plotly visualization preview</p>
          </div>
        </div>
      );
    } else {
      // Fallback for other types or manual content
      return (
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 text-center">Visualization Preview</p>
        </div>
      );
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'chart':
      case 'vega-lite':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'plotly':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'table':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
          </svg>
        );
      case 'graph':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'chart':
      case 'vega-lite':
        return 'text-blue-500';
      case 'plotly':
        return 'text-purple-500';
      case 'table':
        return 'text-green-500';
      case 'graph':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVegaLiteTemplate = () => {
    return `{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A simple bar chart",
  "data": {
    "values": [
      {"category": "A", "value": 28},
      {"category": "B", "value": 55},
      {"category": "C", "value": 43},
      {"category": "D", "value": 91}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "category", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}`;
  };

  const getPlotlyTemplate = () => {
    return `{
  "data": [
    {
      "x": ["A", "B", "C", "D"],
      "y": [28, 55, 43, 91],
      "type": "bar"
    }
  ],
  "layout": {
    "title": "Sample Bar Chart",
    "xaxis": {"title": "Category"},
    "yaxis": {"title": "Value"}
  }
}`;
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Charts & Visualizations</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
          >
            Add Visualization
          </button>
        </div>

        {showCreateForm && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Add New Visualization</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visualization Name
                </label>
                <input
                  type="text"
                  value={newImageName}
                  onChange={(e) => setNewImageName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                  placeholder="e.g., customer_churn_analysis"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visualization Type
                </label>
                <select
                  value={newVisualizationType}
                  onChange={(e) => {
                    setNewVisualizationType(e.target.value as 'vega-lite' | 'plotly' | 'manual');
                    if (e.target.value === 'vega-lite') {
                      setNewImageData(getVegaLiteTemplate());
                    } else if (e.target.value === 'plotly') {
                      setNewImageData(getPlotlyTemplate());
                    } else {
                      setNewImageData('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                >
                  <option value="vega-lite">Vega-Lite (Recommended)</option>
                  <option value="plotly">Plotly</option>
                  <option value="manual">Manual/Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newVisualizationType === 'vega-lite' ? 'Vega-Lite Specification (JSON)' :
                   newVisualizationType === 'plotly' ? 'Plotly Specification (JSON)' :
                   'Visualization Data'}
                </label>
                <textarea
                  value={newImageData}
                  onChange={(e) => setNewImageData(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 font-mono text-sm"
                  placeholder={
                    newVisualizationType === 'vega-lite' ? 'Paste Vega-Lite JSON specification...' :
                    newVisualizationType === 'plotly' ? 'Paste Plotly JSON specification...' :
                    'Paste visualization data or URL here...'
                  }
                  rows={8}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createImage}
                  disabled={loading}
                  className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Add Visualization'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-600">No visualizations yet. Start research to automatically generate charts and tables!</p>
            <p className="text-sm text-gray-500 mt-2">
              Tip: Use Vega-Lite for declarative charts or Plotly for interactive visualizations
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((visualization, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={getTypeColor(visualization.type)}>
                        {getVisualizationIcon(visualization.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{visualization.name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{visualization.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatTimestamp(visualization.timestamp)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{visualization.description}</p>
                  
                  {/* Interactive Visualization Preview */}
                  <div className="mb-3">
                    {renderVisualization(visualization)}
                  </div>
                  
                  {visualization.code && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                        View Code
                      </summary>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        <code>{visualization.code}</code>
                      </pre>
                    </details>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{visualization.filename}</span>
                    <button 
                      className="text-xs text-cedar-600 hover:text-cedar-700"
                      onClick={() => {
                        setSelectedVisualization(visualization);
                        setShowPreview(true);
                      }}
                    >
                      Full View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full View Modal */}
      {showPreview && selectedVisualization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedVisualization.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">{selectedVisualization.description}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {renderVisualization(selectedVisualization)}
            </div>
            
            {selectedVisualization.code && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-700 hover:text-gray-900 mb-2 font-medium">
                  View Code
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  <code>{selectedVisualization.code}</code>
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagesTab; 