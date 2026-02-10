const Roles = {
    ADMIN: 'Admin',
    ENGINEER: 'Engineer',
    STAFF: 'Staff',
    VISITOR: 'Visitor',
    SECURITY: 'Security',
};

const MAP_CONFIG = {
    width: 100,
    height: 130, // Total playable height including footpath
    footpath: {
        yStart: 110,
        yEnd: 125,
        xPadding: 5
    }
};

const DOORS = {
    1: { id: 1, name: 'Main Entrance', requiredRoles: Object.values(Roles), authType: 'password', isRegistrationPoint: true, position: { x: 50, y: 99 }, orientation: 'horizontal', size: 12 },
    2: { id: 2, name: 'Staff Lounge', requiredRoles: [Roles.STAFF, Roles.ADMIN, Roles.ENGINEER, Roles.SECURITY], position: { x: 17, y: 66 }, orientation: 'horizontal', size: 10 },
    3: { id: 3, name: 'Security Office', requiredRoles: [Roles.SECURITY, Roles.ADMIN, Roles.ENGINEER], authType: 'pin', position: { x: 83, y: 66 }, orientation: 'horizontal', size: 10 },
    4: { id: 4, name: 'Engineering Bay', requiredRoles: [Roles.ENGINEER, Roles.ADMIN, Roles.SECURITY], position: { x: 50, y: 66 }, orientation: 'horizontal', size: 10 },
    5: { id: 5, name: 'Server Room', requiredRoles: [Roles.ENGINEER, Roles.ADMIN, Roles.SECURITY], authType: 'pin', position: { x: 50, y: 36 }, orientation: 'horizontal', size: 10 },
    6: { id: 6, name: 'Secure Link', requiredRoles: [Roles.ENGINEER, Roles.ADMIN, Roles.SECURITY], authType: 'pin', position: { x: 68, y: 50 }, orientation: 'vertical', size: 10 },
};

module.exports = {
    Roles,
    MAP_CONFIG,
    DOORS
};
