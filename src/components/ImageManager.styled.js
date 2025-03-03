import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

export const UploadArea = styled.div`
  margin-bottom: 20px;
  padding: 40px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;

  &:hover {
    border-color: #666;
    background: #f0f1f2;
  }

  input[type="file"] {
    display: none;
  }
`;

export const HelpText = styled.label`
  font-size: 1.1em;
  color: #666;
  margin: 10px 0;
  display: block;
`;

export const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

export const ImageCard = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
`;

export const ImageInfo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
  overflow-y: auto;
  border-radius: 8px;

  ${ImageCard}:hover & {
    opacity: 1;
  }

  p {
    margin: 8px 0;
    font-size: 13px;
    line-height: 1.4;

    &:first-child {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 12px;
    }
  }
`;

export const Stats = styled.div`
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 20px 0;

  p {
    margin: 0;
    font-size: 16px;
    color: #333;
  }
`;

export const Loading = styled.div`
  text-align: center;
  padding: 30px;
`;

export const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 10px;
  font-size: 14px;
`;

export const FilterBar = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 20px 0;
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
`;

export const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2980b9;
  }
`;

export const MonthGroup = styled.div`
  margin: 30px 0 15px;
  
  h2 {
    font-size: 1.5em;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #3498db;
  }
`;

export const Dialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  input, textarea {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  textarea {
    min-height: 100px;
  }
`; 