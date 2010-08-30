require 'rubygems'
require 'yaml'
require 'json'
require 'ruby-debug'

namespace :tunnel do
  
  def config(name)
    app_config = File.expand_path '../config/app.json', __FILE__
    app = JSON.parse(IO.read(app_config))
    key = name.to_s+'_port'
    raise "No app config found for name. #{name.inspect}" unless app[key]
    @port = app[key].to_i
    tunnel_config = File.expand_path "../config/tunnel.yml", __FILE__    
    tunnel = YAML.load_file(tunnel_config)['tunnel']
    @public_host_username = tunnel['public_host_username']
    @public_host = tunnel['public_host']
    @ssh_port = tunnel['ssh_port'] || 22
    @server_alive_interval = tunnel['server_alive_interval'] || 0
    @notification = "Starting tunnel #{@public_host}:#{@port} to 0.0.0.0:#{@port}"
    @notification << " using SSH port #{@ssh_port}" unless @ssh_port == 22
    @ssh_command = %Q[ssh -v -p #{@ssh_port} -nNT4 -o "ServerAliveInterval #{@server_alive_interval}" -R *:#{@port}:localhost:#{@port} #{@public_host_username}@#{@public_host}]
    puts  @ssh_command
  end
  
  task :start_monitor do
    config(:monitor)
    puts @notification
    system @ssh_command
  end

  task :start_tracking do
    config(:tracking)
    puts @notification
    system @ssh_command
  end
  
  task :start_websocket do
    config(:websocket)
    puts @notification
    system @ssh_command
  end

end