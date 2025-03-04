import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Popover } from 'antd';
import { Title } from './ImageManager.styled';
import Viewer from 'react-viewer';

const NotesContainer = styled.div`
  flex: 1;
  margin-left: 200px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
`;

const ImageGrid = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: 20px;
  padding: 20px 0;
`;

const ImageCard = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const NoteContent = styled.div`
  padding: 10px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
`;

const NotesView = ({ images }) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imagesWithNotes = useMemo(() => {
    return images.filter(img => img.notes && img.notes.trim().length > 0);
  }, [images]);

  const onImageClick = (index) => {
    setCurrentIndex(index);
    setVisible(true);
  };

  return (
    <NotesContainer>
      <ContentWrapper>
        <Title>笔记列表</Title>
        <ImageGrid>
          {imagesWithNotes.map((image, index) => (
            <ImageCard 
              key={image.path} 
              onClick={() => onImageClick(index)}
            >
              <img src={image.url} alt={image.name} loading="lazy" />
              <NoteContent>
                <Popover
                  content={image.notes}
                  title="完整笔记"
                  trigger="hover"
                  placement="bottom"
                >
                  <p>{image.notes.length > 50 ? `${image.notes.slice(0, 50)}...` : image.notes}</p>
                </Popover>
              </NoteContent>
            </ImageCard>
          ))}
        </ImageGrid>
        {imagesWithNotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>暂无笔记</p>
          </div>
        )}
      </ContentWrapper>
      <Viewer
        visible={visible}
        onClose={() => {
          setVisible(false);
        }}
        images={imagesWithNotes.map(img => ({ src: img.url, alt: img.name }))}
        activeIndex={currentIndex}
        onMaskClick={() => setVisible(false)}
      />
    </NotesContainer>
  );
};

export default NotesView; 