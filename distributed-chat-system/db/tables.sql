CREATE TABLE User (
                      id BIGINT PRIMARY KEY AUTO_INCREMENT,
                      username VARCHAR(100) NOT NULL,
                      email VARCHAR(150) NOT NULL,
                      password VARCHAR(255) NOT NULL,
                      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                      CONSTRAINT uq_username UNIQUE (username),
                      CONSTRAINT uq_email UNIQUE (email)
);


CREATE TABLE ChatRoom (
                          id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(150) NOT NULL,
                          type ENUM('PRIVATE', 'GROUP') NOT NULL,
                          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE RoomMember (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            roomId BIGINT NOT NULL,
                            userId BIGINT NOT NULL,
                            joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_room FOREIGN KEY (roomId)
                                REFERENCES ChatRoom(id)
                                ON DELETE CASCADE,

                            CONSTRAINT fk_user FOREIGN KEY (userId)
                                REFERENCES User(id)
                                ON DELETE CASCADE,

                            CONSTRAINT uq_room_user UNIQUE (roomId, userId)
);

CREATE TABLE Message (
                         id BIGINT PRIMARY KEY AUTO_INCREMENT,
                         roomId BIGINT NOT NULL,
                         senderId BIGINT NOT NULL,
                         content TEXT NOT NULL,
                         createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_message_room FOREIGN KEY (roomId)
                             REFERENCES ChatRoom(id)
                             ON DELETE CASCADE,

                         CONSTRAINT fk_message_sender FOREIGN KEY (senderId)
                             REFERENCES User(id)
                             ON DELETE CASCADE
);














