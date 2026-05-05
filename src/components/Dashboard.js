import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { folderApi, imageApi } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRef = useRef(null);

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const loadCurrentFolder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const foldersRes = await folderApi.getAll(currentFolderId);
      setFolders(foldersRes.data.folders || []);
      setBreadcrumb(foldersRes.data.breadcrumb || []);
      
      if (currentFolderId) {
        const imagesRes = await imageApi.getByFolder(currentFolderId);
        setImages(imagesRes.data.images || []);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error('Error loading folder:', err);
      showError(err.response?.data?.message || 'Failed to load folder');
    }
    setLoading(false);
  }, [currentFolderId, showError]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      loadCurrentFolder();
    }
  }, [currentFolderId, loadCurrentFolder, navigate]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setActionLoading(true);
    try {
      await folderApi.create(newFolderName, currentFolderId);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadCurrentFolder();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create folder');
    }
    setActionLoading(false);
  };

  const handleDeleteFolder = async (folderId) => {
    setContextMenu(null);
    if (!window.confirm('Delete this folder and all its contents? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await folderApi.delete(folderId);
      loadCurrentFolder();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete folder');
    }
    setActionLoading(false);
  };

  const handleRenameFolder = async (folderId, currentName) => {
    const newName = window.prompt('Enter new name:', currentName);
    if (!newName || newName === currentName) return;
    setActionLoading(true);
    try {
      await folderApi.rename(folderId, newName);
      loadCurrentFolder();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to rename folder');
    }
    setActionLoading(false);
    setContextMenu(null);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10MB');
      return;
    }
    
    if (!currentFolderId) {
      showError('Please select a folder first');
      return;
    }
    
    setActionLoading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('name', imageName || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('folderId', currentFolderId);
    formData.append('image', file);
    
    try {
      await imageApi.upload(formData);
      setShowUploadImage(false);
      setImageName('');
      setUploadProgress(100);
      loadCurrentFolder();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to upload image');
    }
    setActionLoading(false);
    setUploadProgress(0);
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this image? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await imageApi.delete(imageId);
      loadCurrentFolder();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete image');
    }
    setActionLoading(false);
  };

  const navigateToFolder = (folderId) => setCurrentFolderId(folderId);
  const navigateBack = (index) => setCurrentFolderId(index === -1 ? null : breadcrumb[index].id);
  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDragStart = (e, type, item) => {
    setDraggedItem({ type, item });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id: item.id }));
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    e.target.classList.remove('dragging');
  };

  const handleDropOnFolder = async (targetFolderId) => {
    if (!draggedItem || draggedItem.type !== 'image') return;
    
    const formData = new FormData();
    formData.append('name', draggedItem.item.name);
    formData.append('folderId', targetFolderId);
    formData.append('image', draggedItem.item.url);
    
    try {
      await imageApi.upload(formData);
      loadCurrentFolder();
    } catch (err) {
      showError('Failed to move image');
    }
    setDraggedItem(null);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="logo">
          <div className="logo-icon">📁</div>
          <div className="logo-text">
            <h1>Dobby Ads</h1>
            <span>Welcome, {user?.name || 'User'}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="action-btn secondary" onClick={() => setShowCreateFolder(true)} disabled={actionLoading}>
            <span className="btn-icon">+</span>
            New Folder
          </button>
          <button className="action-btn primary" onClick={() => setShowUploadImage(true)} disabled={actionLoading}>
            <span className="btn-icon">📷</span>
            Upload Image
          </button>
          <button className="action-btn danger" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-toast">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => navigateBack(-1)}>
          🏠 Root
        </button>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={item.id}>
            <span className="breadcrumb-separator">›</span>
            <button className="breadcrumb-item" onClick={() => navigateBack(index)}>
              {item.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="dashboard-content">
        {(loading || actionLoading) && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>{actionLoading ? 'Processing...' : 'Loading...'}</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="storage-info">
              <span>📊 {folders.length} folders · {images.length} images</span>
              {currentFolderId && (
                <button className="back-btn" onClick={() => navigateBack(breadcrumb.length - 1)}>
                  ← Back
                </button>
              )}
            </div>

            {folders.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2>📁 Folders</h2>
                </div>
                <div className="folders-grid">
                  {folders.map(folder => (
                    <div 
                      key={folder.id} 
                      className="folder-card"
                      onClick={() => navigateToFolder(folder.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ type: 'folder', id: folder.id, name: folder.name, x: e.clientX, y: e.clientY });
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'folder', folder)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => { e.preventDefault(); handleDropOnFolder(folder.id); }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="folder-card-icon">📁</div>
                      <div className="folder-card-info">
                        <h4>{folder.name}</h4>
                        <p>{folder.sizeFormatted || '0 B'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2>🖼️ Images</h2>
                </div>
                <div className="images-grid">
                  {images.map(image => (
                    <div 
                      key={image.id} 
                      className="image-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'image', image)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="image-preview" onClick={() => setSelectedImage(image)}>
                        <img src={image.url} alt={image.name} loading="lazy" />
                        <div className="image-overlay">
                          <span>View</span>
                        </div>
                      </div>
                      <div className="image-info">
                        <h4 title={image.name}>{image.name}</h4>
                        <p>{image.sizeFormatted}</p>
                      </div>
                      <button 
                        className="image-delete-btn" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {folders.length === 0 && images.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h2>This folder is empty</h2>
                <p>Create a new folder or upload an image to get started</p>
                <div className="empty-actions">
                  <button className="action-btn secondary" onClick={() => setShowCreateFolder(true)}>
                    + New Folder
                  </button>
                  <button className="action-btn primary" onClick={() => setShowUploadImage(true)}>
                    📷 Upload Image
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateFolder && (
        <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
                maxLength={100}
              />
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadImage && (
        <div className="modal-overlay" onClick={() => setShowUploadImage(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Image</h3>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Image name (optional)"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                maxLength={100}
              />
              <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="drop-icon">📷</div>
                <p>Click to select or drag and drop</p>
                <span>Max size: 10MB</span>
              </div>
              {uploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowUploadImage(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="modal-overlay image-lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage.url} alt={selectedImage.name} />
            <div className="lightbox-info">
              <h3>{selectedImage.name}</h3>
              <p>{selectedImage.sizeFormatted} · {selectedImage.mimeType}</p>
              <a href={selectedImage.url} target="_blank" rel="noopener noreferrer" className="btn">
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' && (
            <>
              <button onClick={() => handleRenameFolder(contextMenu.id, contextMenu.name)}>
                ✏️ Rename
              </button>
              <button className="danger" onClick={() => handleDeleteFolder(contextMenu.id)}>
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;