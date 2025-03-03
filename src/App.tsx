import React, { useState, useEffect } from 'react';
import { Search, Save, Lock, Clock, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:5000/api';

function App() {
  const [mode, setMode] = useState<'create' | 'view' | 'access'>('create');
  const [noteName, setNoteName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noteInfo, setNoteInfo] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [accessNoteName, setAccessNoteName] = useState('');

  // Check if URL has a note name
  useEffect(() => {
    const path = window.location.pathname.substring(1);
    if (path) {
      setNoteName(path);
      setMode('view');
      fetchNote(path);
    }
  }, []);

  // Update URL when note name changes in create mode
  useEffect(() => {
    if (mode === 'create' && noteName) {
      window.history.replaceState(null, '', `/${noteName}`);
    }
  }, [noteName, mode]);

  const fetchNote = async (name: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/notes/${name}`);
      
      if (response.data.hasPassword) {
        setIsPasswordProtected(true);
        setNoteInfo(response.data);
      } else {
        setNoteContent(response.data.content);
        setNoteInfo(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching note:', err);
      setError(err.response?.data?.message || 'Failed to fetch note');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteName || !noteContent) {
      setError('Note name and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const noteData: any = {
        name: noteName,
        content: noteContent
      };

      if (isPasswordProtected && password) {
        noteData.password = password;
      }

      if (hasExpiration && expiresIn) {
        noteData.expiresIn = expiresIn;
      }

      await axios.post(`${API_URL}/notes`, noteData);
      setSuccess('Note saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const accessProtectedNote = async () => {
    if (!passwordInput) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/notes/${noteName}/access`, {
        password: passwordInput
      });
      
      setNoteContent(response.data.content);
      setIsPasswordProtected(false);
    } catch (err: any) {
      console.error('Error accessing note:', err);
      setError(err.response?.data?.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(noteContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNew = () => {
    setMode('create');
    setNoteName('');
    setNoteContent('');
    setPassword('');
    setExpiresIn('');
    setIsPasswordProtected(false);
    setHasExpiration(false);
    setError('');
    setSuccess('');
    setNoteInfo(null);
    window.history.pushState(null, '', '/');
  };

  const handleAccessMode = () => {
    setMode('access');
    setError('');
    setSuccess('');
    setNoteInfo(null);
    setIsPasswordProtected(false);
    setNoteContent('');
    setAccessNoteName('');
    setPasswordInput('');
  };

  const handleAccessNote = () => {
    if (!accessNoteName) {
      setError('Note name is required');
      return;
    }
    
    setNoteName(accessNoteName);
    setMode('view');
    window.history.pushState(null, '', `/${accessNoteName}`);
    fetchNote(accessNoteName);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={handleCreateNew}>TextShare</h1>
          <div className="flex space-x-4">
            <button 
              onClick={handleCreateNew}
              className={`px-4 py-2 rounded-md transition ${mode === 'create' ? 'bg-white text-indigo-600' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
            >
              Create
            </button>
            <button 
              onClick={handleAccessMode}
              className={`px-4 py-2 rounded-md transition ${mode === 'access' ? 'bg-white text-indigo-600' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
            >
              Access
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Create Mode */}
        {mode === 'create' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Create or Update a Note</h2>
            
            {/* Note Name */}
            <div className="mb-6">
              <label htmlFor="noteName" className="block text-sm font-medium text-gray-700 mb-1">
                Note Name (required)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="noteName"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter a unique name for your note"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              </div>
            </div>
            
            {/* Note Content */}
            <div className="mb-6">
              <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">
                Note Content (required)
              </label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[200px]"
                placeholder="Enter your text here..."
              />
            </div>
            
            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Password Protection */}
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="passwordProtection"
                    checked={isPasswordProtected}
                    onChange={() => setIsPasswordProtected(!isPasswordProtected)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="passwordProtection" className="ml-2 block text-sm text-gray-700 flex items-center">
                    <Lock size={16} className="mr-1" /> Password Protection
                  </label>
                </div>
                {isPasswordProtected && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter password"
                  />
                )}
              </div>
              
              {/* Expiration */}
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="expiration"
                    checked={hasExpiration}
                    onChange={() => setHasExpiration(!hasExpiration)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="expiration" className="ml-2 block text-sm text-gray-700 flex items-center">
                    <Clock size={16} className="mr-1" /> Auto-delete after
                  </label>
                </div>
                {hasExpiration && (
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select time period</option>
                    <option value="1">1 hour</option>
                    <option value="24">24 hours</option>
                    <option value="168">7 days</option>
                    <option value="720">30 days</option>
                  </select>
                )}
              </div>
            </div>
            
            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <CheckCircle size={20} className="mr-2" />
                {success}
              </div>
            )}
            
            {/* Save Button */}
            <button
              onClick={handleSaveNote}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Note
                </>
              )}
            </button>
            
            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
              <p className="mb-2"><strong>How to use:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enter a unique name for your note</li>
                <li>Add your content in the text area</li>
                <li>Optionally add password protection or set an expiration time</li>
                <li>Click Save to store your note</li>
                <li>Share the URL with others to let them access your note</li>
              </ul>
            </div>
          </div>
        )}

        {/* Access Mode */}
        {mode === 'access' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Access a Saved Note</h2>
            
            {/* Note Name */}
            <div className="mb-6">
              <label htmlFor="accessNoteName" className="block text-sm font-medium text-gray-700 mb-1">
                Note Name (required)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="accessNoteName"
                  value={accessNoteName}
                  onChange={(e) => setAccessNoteName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter the name of the note you want to access"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}
            
            {/* Access Button */}
            <button
              onClick={handleAccessNote}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
            >
              {loading ? 'Accessing...' : (
                <>
                  <Search size={20} className="mr-2" />
                  Access Note
                </>
              )}
            </button>
            
            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
              <p className="mb-2"><strong>How to access a note:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enter the exact name of the note you want to access</li>
                <li>Click "Access Note" to retrieve it</li>
                <li>If the note is password protected, you'll be prompted to enter the password</li>
                <li>You can also access notes directly by using the URL format: <code>yourdomain.com/notename</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* View Mode */}
        {mode === 'view' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">Note: {noteName}</span>
              {noteInfo && noteInfo.expiresAt && (
                <span className="text-sm font-normal text-gray-500 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Expires: {formatDate(noteInfo.expiresAt)}
                </span>
              )}
            </h2>
            
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            ) : isPasswordProtected ? (
              <div className="py-4">
                <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                  This note is password protected. Please enter the password to view it.
                </div>
                
                <div className="mb-4">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter password"
                  />
                </div>
                
                <button
                  onClick={accessProtectedNote}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
                >
                  <Lock size={20} className="mr-2" />
                  Access Note
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={16} className="mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-1" />
                        Copy to clipboard
                      </>
                    )}
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[200px] whitespace-pre-wrap">
                  {noteContent}
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {noteInfo && noteInfo.createdAt && (
                      <span>Created: {formatDate(noteInfo.createdAt)}</span>
                    )}
                  </div>
                  
                  <a
                    href={`/${noteName}`}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                  >
                    <ExternalLink size={16} className="mr-1" />
                    Shareable Link
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-100 p-4 mt-8">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} TextShare - A simple text sharing service
        </div>
      </footer>
    </div>
  );
}

export default App;