import React, { useState, useEffect, useCallback } from 'react'
import ImageManager from './components/ImageManager'
import NotesView from './components/NotesView'
import Sidebar from './components/Sidebar'
import { imageDB } from './utils/imageDB'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('home');
  const [activeFilter, setActiveFilter] = useState('');
  const [images, setImages] = useState([]);
  const [showUploader, setShowUploader] = useState(true);
  const [noteCount, setNoteCount] = useState(0);
  
  const fetchNoteCount = useCallback(() => {
    const count = images.filter(img => img.notes && img.notes.trim().length > 0).length;
    setNoteCount(count);
  }, [images]);

  // 初始化 IndexedDB
  useEffect(() => {
    imageDB.init().catch(console.error);
  }, []);

  // 监听 images 变化，更新笔记数量
  useEffect(() => {
    fetchNoteCount();
  }, [fetchNoteCount]); 

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
        noteCount={noteCount}
      />
      {renderContent()}
    </div>
  )
}

export default App
