package com.farm.saas.common.util;

public final class GeoDistanceUtils {

    private static final double EARTH_RADIUS_METERS = 6371000.0;

    private GeoDistanceUtils() {
    }

    /**
     * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
     *
     * @param lat1 Latitude of point 1 (in degrees)
     * @param lon1 Longitude of point 1 (in degrees)
     * @param lat2 Latitude of point 2 (in degrees)
     * @param lon2 Longitude of point 2 (in degrees)
     * @return Distance in meters
     */
    public static double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaPhi / 2.0) * Math.sin(deltaPhi / 2.0)
                + Math.cos(phi1) * Math.cos(phi2)
                * Math.sin(deltaLambda / 2.0) * Math.sin(deltaLambda / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Checks if current GPS point is within the geofence radius of the farm.
     *
     * @param currentLat   Current latitude
     * @param currentLon   Current longitude
     * @param farmLat      Farm center latitude
     * @param farmLon      Farm center longitude
     * @param radiusMeters Allowed geofence radius in meters
     * @return true if distance <= radiusMeters, false otherwise
     */
    public static boolean isWithinGeofence(double currentLat, double currentLon, double farmLat, double farmLon, double radiusMeters) {
        return calculateDistanceMeters(currentLat, currentLon, farmLat, farmLon) <= radiusMeters;
    }
}
