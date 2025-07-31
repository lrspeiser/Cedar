import React, { useState, useEffect } from 'react'
import { apiService } from '../api'

interface VariableInfo {
  name: string
  type_name: string
  shape?: string
  purpose: string
  example_value: string
  source: string
  updated_at: string
  related_to: string[]
  visibility: string
  units?: string
  tags: string[]
}

interface VariablesTabProps {
  projectId: string
}

const VariablesTab: React.FC<VariablesTabProps> = ({ projectId }) => {
  const [variables, setVariables] = useState<VariableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVariable, setEditingVariable] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    purpose: '',
    tags: '',
    visibility: 'public'
  })

  useEffect(() => {
    loadVariables()
  }, [projectId])

  const loadVariables = async () => {
    try {
      setLoading(true)
      const vars = await apiService.getVariables(projectId)
      setVariables(vars as VariableInfo[])
    } catch (error) {
      console.error('Failed to load variables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (variable: VariableInfo) => {
    setEditingVariable(variable.name)
    setEditForm({
      purpose: variable.purpose,
      tags: variable.tags.join(', '),
      visibility: variable.visibility
    })
  }

  const handleSave = async (variableName: string) => {
    try {
      const updates = {
        purpose: editForm.purpose,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        visibility: editForm.visibility
      }
      
      await apiService.updateVariable(projectId, variableName, updates)
      setEditingVariable(null)
      loadVariables() // Refresh the list
    } catch (error) {
      console.error('Failed to update variable:', error)
    }
  }

  const handleDelete = async (variableName: string) => {
    if (window.confirm(`Are you sure you want to delete the variable "${variableName}"?`)) {
      try {
        await apiService.deleteVariable(projectId, variableName)
        loadVariables() // Refresh the list
      } catch (error) {
        console.error('Failed to delete variable:', error)
      }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTypeColor = (typeName: string) => {
    const colors: { [key: string]: string } = {
      'pd.DataFrame': 'bg-blue-100 text-blue-800',
      'numpy.ndarray': 'bg-green-100 text-green-800',
      'list': 'bg-purple-100 text-purple-800',
      'dict': 'bg-yellow-100 text-yellow-800',
      'str': 'bg-gray-100 text-gray-800',
      'int': 'bg-red-100 text-red-800',
      'float': 'bg-orange-100 text-orange-800'
    }
    return colors[typeName] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Variables</h2>
        <p className="text-gray-600">
          Track and manage variables created during code execution. Variables are automatically detected and can be annotated with descriptions and tags.
        </p>
      </div>

      {variables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No variables yet</h3>
          <p className="text-gray-500">
            Variables will appear here after you execute code that creates them.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Shape
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variables.map((variable) => (
                  <tr key={variable.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {variable.name}
                        </div>
                        {variable.visibility !== 'public' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {variable.visibility}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type_name)}`}>
                          {variable.type_name}
                        </span>
                        {variable.shape && (
                          <span className="text-xs text-gray-500">
                            {variable.shape}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingVariable === variable.name ? (
                        <input
                          type="text"
                          value={editForm.purpose}
                          onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Describe the variable's purpose..."
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={variable.purpose}>
                          {variable.purpose}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingVariable === variable.name ? (
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="tag1, tag2, tag3..."
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {variable.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cedar-100 text-cedar-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(variable.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingVariable === variable.name ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(variable.name)}
                            className="text-cedar-600 hover:text-cedar-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingVariable(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(variable)}
                            className="text-cedar-600 hover:text-cedar-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(variable.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Variable Tracking Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Variables are automatically detected when you execute code</li>
          <li>• Add descriptive purposes and tags to help organize your work</li>
          <li>• Use tags to group related variables (e.g., "data", "model", "plot")</li>
          <li>• Variables marked as "hidden" won't appear in suggestions</li>
        </ul>
      </div>
    </div>
  )
}

export default VariablesTab 