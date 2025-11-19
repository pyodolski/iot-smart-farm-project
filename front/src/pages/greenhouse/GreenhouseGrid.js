import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGrid } from '../../utils/useGrid';
import { useError } from '../../utils/useError';
import { greenhouseService } from '../../utils/api';
import './GreenhouseGrid.css';

function GreenhouseGrid() {
  const navigate = useNavigate();
  const { farmId } = useParams();
  const location = useLocation();
  const { error, handleError } = useError();
  
  // URL 파라미터 처리
  const urlParams = new URLSearchParams(location.search);
  const greenhouseId = location.state?.greenhouseId || urlParams.get('edit');
  const initialData = location.state;

  // 상태 관리
  const [houseName, setHouseName] = useState(initialData?.houseName || '');
  const [currentValue, setCurrentValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 그리드 관리
  const {
    dimensions,
    grid,
    setGrid,
    updateDimensions,
    updateCell
  } = useGrid(
    initialData?.numRows || 10,
    initialData?.numCols || 10,
    initialData?.gridData
  );

  // 그리드 타입 매핑
  const gridTypeMapping = {
    0: { label: '길', color: '#F9F7E8' },
    1: { label: '딸기', color: '#FF8B8B' },
    2: { label: '토마토', color: '#61BFAD' }
  };

  // 마우스 이벤트 핸들러
  const handleCellMouseDown = (r, c) => {
    setIsDragging(true);
    updateCell(r, c, currentValue);
  };

  const handleCellMouseEnter = (r, c) => {
    if (isDragging) updateCell(r, c, currentValue);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 저장 핸들러
  const handleSubmit = async () => {
    try {
      const payload = {
        farm_id: parseInt(farmId),
        name: houseName,
        num_rows: dimensions.rows,
        num_cols: dimensions.cols,
        grid_data: grid
      };

      const endpoint = greenhouseId ? `/update/${greenhouseId}` : '/create';
      const response = await greenhouseService[greenhouseId ? 'updateGrid' : 'createGreenhouse'](
        greenhouseId || payload,
        payload
      );

      alert(response.message);
      navigate(-1);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="greenhouse-container">
      <div className="greenhouse-header">
        <button className="farm-back-button" onClick={() => navigate(-1)}>⬅ 뒤로가기</button>
        <h2 className="greenhouse-title">비닐하우스 그리드 생성기</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="controls-container">
        <div className="control-group">
          <label>하우스 이름:</label>
          <input 
            type="text" 
            className="text-input"
            value={houseName} 
            onChange={e => setHouseName(e.target.value)} 
            placeholder="예: 1동"
          />
        </div>
        <div className="control-group">
          <label>행:</label>
          <input 
            type="number" 
            className="control-input"
            value={dimensions.rows} 
            min={1} 
            onChange={e => updateDimensions(Number(e.target.value), dimensions.cols)} 
          />
        </div>
        <div className="control-group">
          <label>열:</label>
          <input 
            type="number" 
            className="control-input"
            value={dimensions.cols} 
            min={1} 
            onChange={e => updateDimensions(dimensions.rows, Number(e.target.value))} 
          />
        </div>
        <div className="control-group right-controls">
          <div className="value-selector">
            <label>선택 값:</label>
            {[
              { value: 0, label: '길' },
              { value: 1, label: '딸기' },
              { value: 2, label: '토마토' }
            ].map(({ value, label }) => (
              <button
                key={value}
                className={`value-button type-${value} ${currentValue === value ? 'active' : ''}`}
                onClick={() => setCurrentValue(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button 
            className="control-button"
            onClick={handleSubmit}
          >
            ✅ 저장
          </button>
        </div>
      </div>

      <div
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${dimensions.cols}, 45px)`,
          gridTemplateRows: `repeat(${dimensions.rows}, 45px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((value, c) => (
            <div
              key={`${r}-${c}`}
              className={`grid-cell type-${value}`}
              onMouseDown={() => handleCellMouseDown(r, c)}
              onMouseEnter={() => handleCellMouseEnter(r, c)}
            >
              {gridTypeMapping[value].label}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GreenhouseGrid; 