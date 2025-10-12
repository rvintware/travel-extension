// Core data types for Phase 0.1

export interface SavedCapture {
  id: string;              // UUID
  text: string;            // Highlighted text
  url: string;             // Source URL
  pageTitle: string;       // Page title
  timestamp: number;       // Unix timestamp
  tripId: string;          // Hardcoded "default" for Phase 0.1
}

export interface StorageData {
  captures: SavedCapture[];
  userId: string;          // Generated on install (for future)
}

// Message types for communication between extension components
export interface Message {
  type: 'CAPTURE_SAVE' | 'SHOW_TOAST' | 'CAPTURES_UPDATED';
  payload?: any;
}

export interface ToastMessage extends Message {
  type: 'SHOW_TOAST';
  payload: {
    message: string;
    duration?: number;
  };
}

export interface CaptureUpdateMessage extends Message {
  type: 'CAPTURES_UPDATED';
  payload: {
    captures: SavedCapture[];
  };
}

