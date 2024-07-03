include .env
export

.PHONY: launch

launch:
	GOOGLE_API_KEY=$(GOOGLE_API_KEY) genkit start