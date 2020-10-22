function getAltRouteGroups(altRoutes) {
    thingStuff[altRoutes] = true;
    thingStuff.altRoutes = [altRoutes];
    return true;
}

const x = {
  thingStuff(myDog) {
    myDog = 2;
  }
};

export default (mainRoute, altRoutes = []) => {
    mainRoute = getAltRouteGroups(altRoutes);
};
