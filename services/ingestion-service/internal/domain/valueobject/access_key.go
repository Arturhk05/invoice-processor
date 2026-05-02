package valueobject

import (
	"errors"
	"unicode"
)

var ErrInvalidAccessKey = errors.New("access key must be exactly 44 digits")

// AccessKey is the NF-e 44-digit access key.
type AccessKey string

func NewAccessKey(raw string) (AccessKey, error) {
	if len(raw) != 44 {
		return "", ErrInvalidAccessKey
	}
	for _, c := range raw {
		if !unicode.IsDigit(c) {
			return "", ErrInvalidAccessKey
		}
	}
	return AccessKey(raw), nil
}

func (a AccessKey) String() string { return string(a) }
