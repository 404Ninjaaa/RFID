
import { Role, Character, Door, Wall, Room, InteractableObject, ObjectType } from '@/types';

// CHARACTERS are now fetched from backend/config
// See src/components/features/admin/AdminDashboard.tsx or App.tsx for usage
export const CHARACTERS: Character[] = [];

// All values are percentages of the container
export const WALL_THICKNESS = 2;

// export const MAP_CONFIG = ... (Moved to Backend)

// Layout with wider middle section (Eng/Server)
export const WALLS: Wall[] = [
  // Outer Walls
  { id: 1, x: 0, y: 0, width: 100, height: 2 }, // Top
  { id: 2, x: 0, y: 0, width: 2, height: 100 }, // Left
  { id: 3, x: 98, y: 0, width: 2, height: 100 }, // Right

  // Bottom Wall (Split for Main Entrance - Door 1)
  { id: 401, x: 0, y: 98, width: 44, height: 2 },
  { id: 402, x: 56, y: 98, width: 42, height: 2 },

  // Internal Walls
  // Lobby/Rooms separator wall (Horizontal) - y=65
  // Left Section (Staff Lounge)
  { id: 501, x: 2, y: 65, width: 10, height: 2 },  // Left of Door 2 
  { id: 502, x: 22, y: 65, width: 23, height: 2 }, // Right of Door 2

  // Middle/Right Section
  { id: 503, x: 55, y: 65, width: 23, height: 2 }, // Right of Door 4
  { id: 504, x: 88, y: 65, width: 10, height: 2 }, // Right of Door 3

  // Vertical Divider between Staff Lounge and (Eng Bay / Server Room) - x=32
  { id: 6, x: 32, y: 2, width: 2, height: 63 },

  // Vertical Divider between Security Office and (Eng Bay / Server Room) - x=68
  { id: 701, x: 68, y: 2, width: 2, height: 43 },
  { id: 702, x: 68, y: 55, width: 2, height: 10 },

  // Horizontal Divider between Server Room and Eng Bay (Split for Door 5)
  { id: 801, x: 32, y: 35, width: 13, height: 2 },
  { id: 802, x: 55, y: 35, width: 15, height: 2 },
];

export const ROOMS: Room[] = [
  { id: 1, name: 'Lobby', x: 2, y: 67, width: 96, height: 31 },
  { id: 2, name: 'Staff Lounge', x: 2, y: 2, width: 30, height: 63 },
  { id: 3, name: 'Engineering Bay', x: 34, y: 37, width: 32, height: 28 },
  { id: 4, name: 'Server Room', x: 34, y: 2, width: 32, height: 33 },
  { id: 5, name: 'Security Office', x: 70, y: 2, width: 28, height: 63 },
];


