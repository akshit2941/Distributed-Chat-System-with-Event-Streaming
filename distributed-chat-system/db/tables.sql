CREATE TABLE User (
                      id BIGINT PRIMARY KEY AUTO_INCREMENT,
                      username VARCHAR(100) NOT NULL,
                      email VARCHAR(150) NOT NULL,
                      password VARCHAR(255) NOT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                      CONSTRAINT uq_username UNIQUE (username),
                      CONSTRAINT uq_email UNIQUE (email)
);


CREATE TABLE chatroom (
                          id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(150) NOT NULL,
                          type ENUM('PRIVATE', 'GROUP') NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE roommember (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            room_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_room FOREIGN KEY (room_id)
                                REFERENCES chatroom(id)
                                ON DELETE CASCADE,

                            CONSTRAINT fk_user FOREIGN KEY (user_id)
                                REFERENCES User(id)
                                ON DELETE CASCADE,

                            CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);

CREATE TABLE message (
                         id BIGINT PRIMARY KEY AUTO_INCREMENT,
                         room_id BIGINT NOT NULL,
                         sender_id BIGINT NOT NULL,
                         content TEXT NOT NULL,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_message_room FOREIGN KEY (room_id)
                             REFERENCES chatroom(id)
                             ON DELETE CASCADE,

                         CONSTRAINT fk_message_sender FOREIGN KEY (sender_id)
                             REFERENCES User(id)
                             ON DELETE CASCADE
);
