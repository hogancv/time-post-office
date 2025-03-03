import React, { useState, useEffect } from 'react'
import ImageManager from './components/ImageManager'
import NotesView from './components/NotesView'
import Sidebar from './components/Sidebar'
import { imageDB } from './utils/imageDB'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('home');
  const [activeFilter, setActiveFilter] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUploader, setShowUploader] = useState(true);
  
  // 初始化 IndexedDB
  useEffect(() => {
    imageDB.init().catch(console.error);
  }, []);

  const handleFilterChange = (filter) => {
    if (filter === 'hasNotes') {
      setActivePage('notes');
    }
    setActiveFilter(activeFilter === filter ? '' : filter);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page !== 'notes') {
      setActiveFilter('');
    }
  };

  const handleReset = () => {
    setShowUploader(true);
    setImages([]);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    // 这里可以添加查看图片的逻辑
  };

  const handleMetadataUpdate = async (imagePath, updates) => {
    try {
      await imageDB.saveMetadata(imagePath, updates);
      setImages(prevImages => 
        prevImages.map(img => 
          img.path === imagePath 
            ? { ...img, ...updates }
            : img
        )
      );
    } catch (error) {
      console.error('更新元数据失败:', error);
    }
  };
  
  const renderContent = () => {
    switch (activePage) {
      case 'notes':
        return (
          <NotesView 
            images={images}
            onImageClick={handleImageClick}
            onMetadataUpdate={handleMetadataUpdate}
          />
        );
      case 'categories':
        return <div>类别页面（待开发）</div>;
      default:
        return (
          <ImageManager 
            images={images}
            setImages={setImages}
            activeFilter={activeFilter}
            onImageClick={handleImageClick}
            onMetadataUpdate={handleMetadataUpdate}
            showUploader={showUploader}
            setShowUploader={setShowUploader}
            onReset={handleReset}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activePage={activePage}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />
      {renderContent()}
    </div>
  )
}

export default App
