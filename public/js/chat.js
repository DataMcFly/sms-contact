var chatManager = function(datamcflyRef) {
	this.datamcflyRef = datamcflyRef;
};

chatManager.prototype = {
    // polls the chat text file via ajax and updates chat windows with new content
    chats: [], // collection of chats in progress
    position: 0, // last position we read from our chat text file

    getChat: function(fromNumber) {
        // finds or creates a chat from a particular recipient
        var foundChat = null;

        // search existing chats
        for (c = 0; c < this.chats.length; c++) {
            if (this.chats[c].from == fromNumber) {
                foundChat = this.chats[c];
            }
        }

        // no existing chat found, so create a new one
        if (foundChat == null) {
            foundChat = new chat( this.datamcflyRef );
            foundChat.init(fromNumber);
            foundChat.displayTemplate();
            this.chats.push(foundChat);
        }

        return foundChat;
    },

    updateChats: function() {
        var _this = this;
		this.datamcflyRef.once('value', function (data) {
			data.forEach( function(message){					
				var row = message.value();
				_this.getChat( row.fromNumber ).addMessage(
					row.textMessage,
					row.tstamp,
					row.direction
				);
			});
		});
		this.datamcflyRef.on('added', function (data) {
			var row = data.value();
			_this.getChat( row.fromNumber ).addMessage(
				row.textMessage,
				row.tstamp,
				row.direction
			);
		});
    }
};

var chat = function(datamcflyRef) {
	this.datamcflyRef = datamcflyRef;
};
chat.prototype = {
    // represents a chat window, renders messages to the screen
    init: function(name) {
        this.from = name; // name of person the chat is from
        // div id names
        this.chatName = 'chat-' + this.from;
        this.buttonName = 'submit-' + this.from;
        this.textName = 'reply-' + this.from;
    },
    replyMessage: function(message) {
        // this is called when you click the reply button
        // calls the controller to send a Twilio SMS and write to the chat file
        var _this = this;
        $.ajax({
            type: "POST",
            url: "/reply",
            data: {
                'To': this.from,
                'Body': message,
                'From': this.from
            },
            dataType: "json",
            success: function(data) {
                // your message was written to the chat file and will be displayed on next poll
            }
        });
    },
    displayTemplate: function() {
        // draw the html for a chat window
        var content = '<div class="chatName">Chat with ' + this.from + '</div> \
        <div class="messages" id="' + this.chatName + '"></div> \
        <div class="messageForm"><textarea id="' + this.textName + '"></textarea><button id="' + this.buttonName + '">Reply</button></div> \
      </div>';
        // wrap the template    
        content = '<div class="chatWindow" id="' + this.tmplName + '">' + content + '</div>';
        // Add it to the screen
        $('#templateContainer').append(content);
        var _this = this;
        // handler for reply button
        $('#' + this.buttonName).click(function() {
            _this.replyMessage($('#' + _this.textName).val());
            $('#' + _this.textName).val('');
        });

    },
    addMessage: function(message, tstamp, direction) {
        // add a message to this chat
        $('#' + this.chatName).append("<div class='message_" + direction + "'>" + message + "<div class='tstamp'>" + tstamp + "</div></div>");
    }
};