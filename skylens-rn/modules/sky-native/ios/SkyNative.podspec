Pod::Spec.new do |s|
  s.name           = 'SkyNative'
  s.version        = '1.0.0'
  s.summary        = 'True-north device attitude for SkyLens'
  s.description    = 'Core Motion attitude in the xTrueNorthZVertical frame, ported from the SwiftUI app.'
  s.author         = 'SkyLens'
  s.homepage       = 'https://github.com/adonistech-sk/Skylens'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
