package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Server is running")
	}).Methods("GET")

	fmt.Println("Server Started on port 8080")
	http.ListenAndServe(":8080", nil)
}
