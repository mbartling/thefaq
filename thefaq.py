import os
from slackclient import SlackClient
import time


BOT_NAME = 'thefaq'
BOT_ID = ''

AT_BOT = ''#"<@" + BOT_ID + ">"
EXAMPLE_COMMAND = "do"

print os.environ.get('SLACK_API_TOKEN')
sc = SlackClient(os.environ.get('SLACK_API_TOKEN'))


def handle_command(command, channel):
    """
        Receives commands directed at the bot and determines if they
        are valid commands. If so, then acts on the commands. If not,
        returns back what it needs for clarification.
    """
    response = "Give me an example to answer your question: " + command 
    sc.api_call("chat.postMessage", channel=channel,
                          text=response, as_user=True)


def parse_slack_output(slack_rtm_output):
    """
        The Slack Real Time Messaging API is an events firehose.
        this parsing function returns None unless a message is
        directed at the Bot, based on its ID.
    """
    output_list = slack_rtm_output
    #print output_list
    if output_list and len(output_list) > 0:
        for output in output_list:
            if output and 'text' in output and AT_BOT in output['text']:
#                print "Received a command"
                # return text after the @ mention, whitespace removed
                return output['text'].split(AT_BOT)[1].strip().lower(), \
                       output['channel']
    return None, None

def getBotName():
    global BOT_ID
    global AT_BOT
    api_call = sc.api_call("users.list")
    if api_call.get('ok'):
        users = api_call.get('members')
        for user in users:
            if 'name' in user and user.get('name') == BOT_NAME:
                BOT_ID = user.get('id')
                AT_BOT = "<@" + BOT_ID + ">"
                print "Got bot id", BOT_ID
    else:
        print "could not find bot name"

if __name__ == "__main__":
    READ_WEBSOCKET_DELAY = 1
    getBotName()

    if sc.rtm_connect():
#        print "Starting theFaq"
        while True:
            command, channel = parse_slack_output(sc.rtm_read())
            if command and channel:
                handle_command(command, channel)

            time.sleep(READ_WEBSOCKET_DELAY)
    else:
        print("Connection to slack failed. Invalid slack token?")

