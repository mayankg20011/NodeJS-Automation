@echo off
set curr_dir=%cd%
chdir /D C:\wamp\www\Fluxxor\APP_NAME\platforms\android
gradlew clean && gradlew assembleRelease