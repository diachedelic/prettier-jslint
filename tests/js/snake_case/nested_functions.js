function getAltRouteGroups(altRoutes) {
    thingStuff[altRoutes] = true;
    thingStuff.altRoutes = [altRoutes];
    return true;
}

export default (mainRoute, altRoutes = []) => {
    mainRoute = getAltRouteGroups(altRoutes);
};
