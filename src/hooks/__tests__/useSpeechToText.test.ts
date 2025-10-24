import { renderHook, act } from '@testing-library/react';
import { useSpeechToText } from '../useSpeechToText.hook';

// Mock the Speech Recognition API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: '',
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
};

// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition),
});

describe('useSpeechToText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSpeechToText());

    expect(result.current.transcript).toBe('');
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useSpeechToText());

    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  it('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useSpeechToText());

    // First start listening
    act(() => {
      result.current.startListening();
    });

    // Then stop listening
    act(() => {
      result.current.stopListening();
    });

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  it('should reset transcript when resetTranscript is called', () => {
    const { result } = renderHook(() => useSpeechToText());

    // Simulate having a transcript
    act(() => {
      result.current.startListening();
    });

    // Reset transcript
    act(() => {
      result.current.resetTranscript();
    });

    expect(result.current.transcript).toBe('');
  });
});
