package utils

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte("Xv/r39KvtLq;J8<u.%4K,o$P/{SNnRqLudpa&KUy.RY")

func ValidateToken(tokenString string) (string, error) {

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid claims")
	}

	userId, ok := claims["sub"].(string)
	if !ok {
		return "", fmt.Errorf("userId not found in token")
	}

	return userId, nil
}
