import React, { useState, useEffect, useCallback } from 'react';
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
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const loadCurrentFolder = useCallback(async () => {
    setLoading(true);
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
    } catch (error) {
      console.error('Error loading folder:', error);
    }
    setLoading(false);
  }, [currentFolderId]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    } else {
      loadCurrentFolder();
    }
  }, [currentFolderId, loadCurrentFolder, navigate]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await folderApi.create(newFolderName, currentFolderId);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadCurrentFolder();
    } catch (error) {
      alert('Failed to create folder: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('Delete this folder and all its contents?')) {
      try {
        await folderApi.delete(folderId);
        loadCurrentFolder();
      } catch (error) {
        alert('Failed to delete folder');
      }
    }
    setContextMenu(null);
  };

  const handleRenameFolder = async (folderId, currentName) => {
    const newName = prompt('Enter new folder name:', currentName);
    if (newName && newName !== currentName) {
      try {
        await folderApi.rename(folderId, newName);
        loadCurrentFolder();
      } catch (error) {
        alert('Failed to rename folder');
      }
    }
    setContextMenu(null);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('name', imageName || file.name);
    formData.append('folderId', currentFolderId);
    formData.append('image', file);
    
    try {
      await imageApi.upload(formData);
      setShowUploadImage(false);
      setImageName('');
      loadCurrentFolder();
    } catch (error) {
      alert('Failed to upload image: ' + (error.response?.data?.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      try {
        await imageApi.delete(imageId);
        loadCurrentFolder();
      } catch (error) {
        alert('Failed to delete image');
      }
    }
  };

  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId);
  };

  const navigateBack = (index) => {
    if (index === -1) {
      setCurrentFolderId(null);
    } else {
      setCurrentFolderId(breadcrumb[index].id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const FolderCard = ({ folder }) => (
    <div className="folder-card" onContextMenu={(e) => {
      e.preventDefault();
      setContextMenu({ type: 'folder', id: folder.id, name: folder.name, x: e.clientX, y: e.clientY });
    }}>
      <div className="folder-icon" onClick={() => navigateToFolder(folder.id)}>
        📁
      </div>
      <div className="folder-name" onClick={() => navigateToFolder(folder.id)}>
        {folder.name}
      </div>
      <div className="folder-size">{folder.sizeFormatted || '0 Bytes'}</div>
    </div>
  );

  const ImageCard = ({ image }) => (
    <div className="image-card">
      <div className="image-preview">
        <img src={image.url} alt={image.name} onClick={() => setSelectedImage(image)} />
      </div>
      <div className="image-name">{image.name}</div>
      <div className="image-size">{formatBytes(image.size)}</div>
      <button className="delete-image-btn" onClick={() => handleDeleteImage(image.id)}>🗑️</button>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="logo">
          <h2>📁 Dobby Ads</h2>
          <span>Welcome, {user?.name}</span>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={() => setShowCreateFolder(true)}>
            + New Folder
          </button>
          <button className="action-btn primary" onClick={() => setShowUploadImage(true)}>
            📷 Upload Image
          </button>
          <button className="action-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigateBack(-1)}>
          Root
        </span>
        {breadcrumb.map((item, index) => (
          <span key={item.id}>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item" onClick={() => navigateBack(index)}>
              {item.name}
            </span>
          </span>
        ))}
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {folders.length > 0 && (
              <div className="section">
                <h3>Folders</h3>
                <div className="folders-grid">
                  {folders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} />
                  ))}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="section">
                <h3>Images</h3>
                <div className="images-grid">
                  {images.map(image => (
                    <ImageCard key={image.id} image={image} />
                  ))}
                </div>
              </div>
            )}

            {folders.length === 0 && images.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>This folder is empty</h3>
                <p>Create a new folder or upload an image to get started</p>
                <div className="empty-actions">
                  <button className="action-btn" onClick={() => setShowCreateFolder(true)}>
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
        <div className="modal" onClick={() => setShowCreateFolder(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateFolder(false)}>Cancel</button>
              <button className="primary" onClick={handleCreateFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showUploadImage && (
        <div className="modal" onClick={() => setShowUploadImage(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upload Image</h3>
            <input
              type="text"
              placeholder="Image name (optional)"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            <div className="modal-actions">
              <button onClick={() => setShowUploadImage(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            <h4>{selectedImage.name}</h4>
            <p>Size: {selectedImage.sizeFormatted}</p>
            <button onClick={() => setSelectedImage(null)}>Close</button>
          </div>
        </div>
      )}

      {contextMenu && (
        <div 
          className="context-menu"
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.type === 'folder' && (
            <>
              <div onClick={() => handleRenameFolder(contextMenu.id, contextMenu.name)}>✏️ Rename</div>
              <div onClick={() => handleDeleteFolder(contextMenu.id)}>🗑️ Delete</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
