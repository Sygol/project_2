import os
from flask import render_template, request, jsonify
from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

global_dict = {}
channels = []


@app.route("/")
def index():
    return render_template('index.html', global_dictionary=global_dict, channels=channels)


@app.route('/add_message')
def add_message_with_ajax():
    channel = request.args.get('channel_name')
    username = request.args.get('username')
    message = request.args.get('message')
    date = request.args.get('date')
    if channel in global_dict.keys():
        if len(global_dict[channel]) == 100:
            global_dict[channel] = global_dict[channel][1:]
        global_dict[channel].append({username: message, 'date': date})
    else:
        global_dict[channel] = [{username: message, 'date': date}]
    return 'OK'


@app.route('/get_channel_messages')
def get_channel_messages_ajax():
    channel = request.args.get('channel')
    try:
        return jsonify(global_dict[channel])
    except KeyError:
        return 'NO MESSAGES'


@app.route('/add_channel')
def add_channel_ajax():
    channel = request.args.get('channel')
    if channel not in channels:
        channels.append(channel)
        return jsonify(channel)
    else:
        return jsonify('this_channel_name_is_already_taken')


@app.route('/remove_message')
def remove_message_ajax():
    channel = request.args.get('channel')
    user = request.args.get('user')
    date = request.args.get('date')
    message = request.args.get('message')
    for i in range(0, len(global_dict[channel])):
        if user in list(global_dict[channel][i].keys()):
            if global_dict[channel][i][user] == message and global_dict[channel][i]['date'] == date:
                global_dict[channel].pop(i)
                return jsonify('ok')
    return 'Not removed'


@socketio.on('send message')
def send_message(data):
    author = data['author']
    date = data['date']
    message = data['message']
    channel = data['channel']
    emit("announce message", {"author": author, 'date': date, 'message': message, 'channel': channel}, broadcast=True)


@socketio.on('add channel')
def add_channel(data):
    channel = data['channel']
    emit("announce channel", {'channel': channel}, broadcast=True)


@socketio.on('remove message')
def remove_message(data):
    user = data['user']
    date = data['date']
    channel = data['channel']
    message_text = data['message_text']
    emit("announce remove message", {"user": user, 'date': date, 'message_text': message_text, 'channel': channel}, broadcast=True)


if __name__ == '__main__':
    socketio.run(app)