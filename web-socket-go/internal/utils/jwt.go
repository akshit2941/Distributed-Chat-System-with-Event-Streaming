package utils

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte("Xv/r39KvtLq;J8<u.%4K,o$P/{SNnRqLudpa&KUy.RY")

func ValidateToken(tokenString string) (int, error) {

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil || !token.Valid {
		return -1, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return -1, fmt.Errorf("invalid claims")
	}

	userIdFloat, ok := claims["userId"].(float64)
	if !ok {
		return -1, fmt.Errorf("userId not found")
	}

	userId := int(userIdFloat)

	return userId, nil
}
