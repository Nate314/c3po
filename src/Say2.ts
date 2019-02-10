
export class Say2 {
    
    private static t: string[] = ["", " one", " two", " three", " four", " five", " six", " seven",
        " eight", " nine", " ten", " eleven", " twelve", " thirteen", " fourteen",
        " fifteen", " sixteen", " seventeen", " eighteen", " nineteen", "", " ten",
        " twenty", " thirty", " fourty", " fifty", " sixty", " seventy", " eighty",
        " ninety", " hundred", "", " thousand", " million", " billion", " trillion"];

    private static log10(val): number {
        return Math.log(val) / Math.LN10;
    }

    private static say(num: number): string {
        let result = "";
        if (num > 19) {
            if (num > 99) result += this.t[Math.floor(num / 100)] + " hundred";
            if (num % 100 < 20 && num % 100 > 0) result += this.t[Math.floor(num % 100)];
            else {
                result += this.t[(Math.floor((num % 100) / 10)) + 20];
                result += this.t[Math.floor(num % 10)];
            }
        }
        else result += this.t[num];
        return result;
    }

    private static say2(num: number): string {
        let result = "";
        const digits = Math.floor(this.log10(num)) + 1;
        const iterations = Math.floor(digits / 3) + ((digits % 3 === 0) ? 0 : 1);
        const parts = new Array(iterations);
        let divisor = Math.floor(Math.pow(10, ((iterations - 1) * 3)));
        for (let i = 0; i < iterations; i++) {
            parts[i] = Math.floor((num / divisor) % 1000);
            const part = this.say(parts[i]);
            result += part + ((parts[i] === 0) ? "" : this.t[30 + iterations - i]);
            divisor /= 1000;
        }
        return result;
    }

    public static compute(inputstring: string): string {
        const input = Number(inputstring);
        if (input > 999999999999999) {
            return 'number is too big';
        }
        else if (input < -999999999999999) {
            return 'number is too small';
        }
        else {
            return ((input < 0) ? "negative" : "") + ((input === 0) ?
                "zero" : ((input < 0) ? this.say2(-1 * input) : this.say2(input)));
        }
    }
}