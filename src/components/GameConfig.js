import React, { useState, useEffect } from 'react';
import './GameConfig.css';

const PRESETS = {
    beginner: {
        name: 'Beginner',
        width: 9,
        height: 9,
        bombs: 10,
        timer: { enabled: true, minutes: 5, seconds: 0 }
    },
    intermediate: {
        name: 'Intermediate',
        width: 16,
        height: 16,
        bombs: 40,
        timer: { enabled: true, minutes: 10, seconds: 0 }
    },
    expert: {
        name: 'Expert',
        width: 30,
        height: 16,
        bombs: 99,
        timer: { enabled: true, minutes: 15, seconds: 0 }
    }
};

const MIN_SIZE = 5;
const MAX_SIZE = 50;
const MIN_BOMBS = 2;
const MAX_BOMBS_PERCENTAGE = 0.35; // Maximum 35% of cells can be bombs

const GameConfig = ({ onStartGame, onConfigChange, initialConfig }) => {
    const [preset, setPreset] = useState('beginner');
    const [config, setConfig] = useState({
        selectedPreset: 'beginner',
        width: MIN_SIZE,      // Default minimum
        height: MIN_SIZE,     // Default minimum
        bombs: MIN_BOMBS,     // Default minimum
        timer: {
            enabled: true,
            minutes: 5,
            seconds: 0
        }
    });
    const [errors, setErrors] = useState({});
    const [inputValues, setInputValues] = useState({
        width: PRESETS.beginner.width.toString(),
        height: PRESETS.beginner.height.toString(),
        bombs: PRESETS.beginner.bombs.toString(),
        minutes: PRESETS.beginner.timer.minutes.toString(),
        seconds: PRESETS.beginner.timer.seconds.toString()
    });

    // Update local config when receiving new config from peers
    useEffect(() => {
        if (initialConfig) {
            setConfig(initialConfig);
            setPreset(initialConfig.selectedPreset);
            // Update input values
            setInputValues({
                width: initialConfig.width.toString(),
                height: initialConfig.height.toString(),
                bombs: initialConfig.bombs.toString(),
                minutes: initialConfig.timer.minutes.toString(),
                seconds: initialConfig.timer.seconds.toString()
            });
        }
    }, [initialConfig]);

    const validateConfig = (newConfig) => {
        const errors = {};
        const width = parseInt(newConfig.width);
        const height = parseInt(newConfig.height);
        const bombs = parseInt(newConfig.bombs);
        const minutes = parseInt(newConfig.timer.minutes);
        const seconds = parseInt(newConfig.timer.seconds);

        // Allow empty values in inputs
        if (newConfig.width && (isNaN(width) || width < MIN_SIZE || width > MAX_SIZE)) {
            errors.width = `Width must be between ${MIN_SIZE} and ${MAX_SIZE}`;
        }

        if (newConfig.height && (isNaN(height) || height < MIN_SIZE || height > MAX_SIZE)) {
            errors.height = `Height must be between ${MIN_SIZE} and ${MAX_SIZE}`;
        }

        if (width && height) {
            const maxBombs = Math.floor(width * height * MAX_BOMBS_PERCENTAGE);
            if (newConfig.bombs && (isNaN(bombs) || bombs < MIN_BOMBS || bombs > maxBombs)) {
                errors.bombs = `Bombs must be between ${MIN_BOMBS} and ${maxBombs}`;
            }
        }

        if (newConfig.timer.enabled) {
            if (newConfig.timer.minutes && (isNaN(minutes) || minutes < 0 || minutes > 99)) {
                errors.minutes = 'Minutes must be between 0 and 99';
            }
            if (newConfig.timer.seconds && (isNaN(seconds) || seconds < 0 || seconds > 59)) {
                errors.seconds = 'Seconds must be between 0 and 59';
            }
            if (!minutes && !seconds) {
                errors.timer = 'Timer must have a value';
            }
        }

        return errors;
    };

    useEffect(() => {
        setErrors(validateConfig(config));
    }, [config]);

    const handlePresetChange = (presetKey) => {
        const newPreset = presetKey === 'custom' ? config : PRESETS[presetKey];
        const newConfig = {
            ...newPreset,
            selectedPreset: presetKey
        };
        
        setPreset(presetKey);
        setConfig(newConfig);
        setInputValues({
            width: newPreset.width.toString(),
            height: newPreset.height.toString(),
            bombs: newPreset.bombs.toString(),
            minutes: newPreset.timer.minutes.toString(),
            seconds: newPreset.timer.seconds.toString()
        });
        
        onConfigChange(newConfig); // Notify peers of the preset change
    };

    const handleConfigChange = (field, value) => {
        let newConfig;
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newConfig = {
                ...config,
                [parent]: {
                    ...config[parent],
                    [child]: value || (child === 'minutes' || child === 'seconds' ? 0 : value)
                }
            };
        } else {
            newConfig = {
                ...config,
                [field]: value || (
                    field === 'width' ? MIN_SIZE :
                    field === 'height' ? MIN_SIZE :
                    field === 'bombs' ? MIN_BOMBS :
                    value
                )
            };
        }

        setInputValues(prev => ({
            ...prev,
            [field.includes('.') ? field.split('.')[1] : field]: value
        }));

        const newErrors = validateConfig(newConfig);
        setErrors(newErrors);
        
        // Only update if there are no errors
        if (Object.keys(newErrors).length === 0) {
            setConfig(newConfig);
            onConfigChange?.(newConfig);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert empty strings to numbers for submission
        const finalConfig = {
            ...config,
            width: parseInt(config.width) || MIN_SIZE,
            height: parseInt(config.height) || MIN_SIZE,
            bombs: parseInt(config.bombs) || MIN_BOMBS,
            timer: {
                ...config.timer,
                minutes: parseInt(config.timer.minutes) || 0,
                seconds: parseInt(config.timer.seconds) || 0
            }
        };

        onStartGame(finalConfig);
    };

    const maxBombs = Math.min(
        Math.floor(config.width * config.height * MAX_BOMBS_PERCENTAGE),
        config.width * config.height - 9
    );

    return (
        <div className="game-config">
            <h2>Minesweeper Setup</h2>
            
            <div className="presets">
                <h3>Presets</h3>
                <div className="preset-buttons">
                    {Object.entries(PRESETS).map(([key, value]) => (
                        <button
                            key={key}
                            className={`preset-button ${preset === key ? 'selected' : ''}`}
                            onClick={() => handlePresetChange(key)}
                        >
                            {value.name}
                        </button>
                    ))}
                    <button
                        className={`preset-button ${preset === 'custom' ? 'selected' : ''}`}
                        onClick={() => handlePresetChange('custom')}
                    >
                        Custom
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="config-form">
                <div className="config-group">
                    <h3>Board Size</h3>
                    <div className="input-row">
                        <label>
                            Width:
                            <input
                                type="number"
                                min={MIN_SIZE}
                                max={MAX_SIZE}
                                value={inputValues.width}
                                onChange={(e) => handleConfigChange('width', e.target.value)}
                            />
                            {errors.width && <span className="error">{errors.width}</span>}
                        </label>
                        <label>
                            Height:
                            <input
                                type="number"
                                min={MIN_SIZE}
                                max={MAX_SIZE}
                                value={inputValues.height}
                                onChange={(e) => handleConfigChange('height', e.target.value)}
                            />
                            {errors.height && <span className="error">{errors.height}</span>}
                        </label>
                    </div>
                </div>

                <div className="config-group">
                    <h3>Bombs</h3>
                    <div className="input-row">
                        <label>
                            Number of bombs:
                            <input
                                type="number"
                                min={MIN_BOMBS}
                                max={maxBombs}
                                value={inputValues.bombs}
                                onChange={(e) => handleConfigChange('bombs', e.target.value)}
                            />
                            {errors.bombs && <span className="error">{errors.bombs}</span>}
                        </label>
                    </div>
                    <div className="info-text">
                        Maximum bombs: {maxBombs} ({Math.round(MAX_BOMBS_PERCENTAGE * 100)}% of cells)
                    </div>
                </div>

                <div className="config-group">
                    <h3>Timer</h3>
                    <div className="input-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.timer.enabled}
                                onChange={(e) => handleConfigChange('timer.enabled', e.target.checked)}
                            />
                            Enable timer
                        </label>
                    </div>
                    {config.timer.enabled && (
                        <div className="input-row">
                            <label>
                                Minutes:
                                <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={inputValues.minutes}
                                    onChange={(e) => handleConfigChange('timer.minutes', e.target.value)}
                                />
                                {errors.minutes && <span className="error">{errors.minutes}</span>}
                            </label>
                            <label>
                                Seconds:
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={inputValues.seconds}
                                    onChange={(e) => handleConfigChange('timer.seconds', e.target.value)}
                                />
                                {errors.seconds && <span className="error">{errors.seconds}</span>}
                            </label>
                        </div>
                    )}
                    {errors.timer && <div className="error">{errors.timer}</div>}
                </div>

                <button 
                    type="submit" 
                    className="start-button"
                    disabled={Object.keys(errors).length > 0}
                >
                    Start Game
                </button>
            </form>
        </div>
    );
};

export default GameConfig; 