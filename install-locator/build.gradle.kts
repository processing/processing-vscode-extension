plugins {
    kotlin("jvm") version "2.1.20"
    application
    id("org.beryx.runtime") version "1.13.1"
}

group = "org.processing"
version = "1.0-SNAPSHOT"

application {
    mainClass.set("InstallLocatorKt")
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(17)
}