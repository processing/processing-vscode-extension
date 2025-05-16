import java.util.prefs.Preferences

fun main () {
    val preferences = Preferences.userRoot().node("org/processing/app")
    val installLocations = preferences.get("installLocations", "")
        .split(",")
        .dropLastWhile { it.isEmpty() }
    println(installLocations)
}