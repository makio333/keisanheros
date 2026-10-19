using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using UnityEngine;

namespace LegendHeroes
{
    [Serializable] public class Problem
    {
        public string text, answer, tier, prompt, wrongAnswer,explanation; public int remainder = -1; public string[] acceptedAnswers,options; public bool language;
        public static string Normalize(string value)
        {
            var s = (value ?? "").Normalize(NormalizationForm.FormKC).Trim();
            var b = new StringBuilder();
            foreach (var c in s) b.Append(c >= 'ァ' && c <= 'ヶ' ? (char)(c - 0x60) : c);
            return b.ToString();
        }
        static bool TryNumber(string input, out decimal result)
        {
            result = 0; var parts = (input ?? "").Normalize(NormalizationForm.FormKC).Replace('−','-').Replace('ー','-').Replace('―','-').Replace('‐','-').Trim().Split('/');
            const NumberStyles style = NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint;
            if (parts.Length == 1) return decimal.TryParse(parts[0], style, CultureInfo.InvariantCulture, out result);
            if (parts.Length != 2 || !decimal.TryParse(parts[0].Trim(), style, CultureInfo.InvariantCulture, out var n) || !decimal.TryParse(parts[1].Trim(), style, CultureInfo.InvariantCulture, out var d) || d == 0) return false;
            result = n / d; return true;
        }
        public bool Accepts(string input)
        {
            if (remainder >= 0)
            {
                var split = Normalize(input).Replace("あまり", " ").Replace("余り", " ").Split(new[]{' ',','},StringSplitOptions.RemoveEmptyEntries);
                return split.Length == 2 && split[0] == answer && split[1] == remainder.ToString();
            }
            if (language)
            {
                // Kana spelling exercises stay exact, including small kana and script.
                bool kanji = text.Any(c => c >= '\u3400' && c <= '\u9fff');
                return (acceptedAnswers ?? new[] { answer }).Any(a => kanji ? Normalize(a) == Normalize(input) : a == (input ?? "").Trim());
            }
            if (!TryNumber(answer, out var expected)) return answer.Contains(":")?Normalize(input).Replace(" ","")==Normalize(answer).Replace(" ",""):Normalize(input)==Normalize(answer);
            return TryNumber(input, out var actual) && Math.Abs(actual - expected) < .00000001m;
        }
    }
}
