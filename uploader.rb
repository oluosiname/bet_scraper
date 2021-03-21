require 'cloudinary'
# require "file"

Cloudinary.config do |config|
  config.cloud_name = 'uniodds'

  config.enhance_image_tag = true
  config.static_file_support = true
end

Dir.glob('/Users/olumuyiwaosiname/Desktop/logos/*png') do |file|
  file_name = File.basename(file, ".*")
  # "/Users/olumuyiwaosiname/234odds-ui/src/assets/images/icon-as-monaco.svg"
  Cloudinary::Uploader.upload(file, quality: 10, public_id: file_name, fetch_format: :auto, invalidate: true, overwrite: true)
end

