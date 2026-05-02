package valueobject

import (
	"errors"
	"unicode"
)

var ErrInvalidCNPJ = errors.New("CNPJ must be exactly 14 digits")

// CNPJ is a Brazilian company registration number (14 digits, no formatting).
type CNPJ string

func NewCNPJ(raw string) (CNPJ, error) {
	if len(raw) != 14 {
		return "", ErrInvalidCNPJ
	}
	for _, c := range raw {
		if !unicode.IsDigit(c) {
			return "", ErrInvalidCNPJ
		}
	}
	return CNPJ(raw), nil
}

func (c CNPJ) String() string { return string(c) }
