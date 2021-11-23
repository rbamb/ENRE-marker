sub usage($) {
    return shift(@_) . <<"END_USAGE";
Usage: $0 -db database
  -db database      Specify Understand database (required for
                    uperl, inherited from Understand)
  -outputFile       Specify the output json file
  -detail           Input with detail information
  -language         Language filter, default don't filter. Possible values include "Ada", "C", "C#", "Fortran", "Java", "Jovial", "Pascal",
                      "Plm", "VHDL" and "Web". C++ is included as part of "C".
  -csv              Only output csf, for debug purpose.
END_USAGE
}

use Understand;
use Getopt::Long;
use strict;
use Data::Dumper;
use JSON;
use File::Basename;

my $dbPath;
my $outputFile;
my $detailOpt;
my $languageFilter;
my $csvOpt;
my $help;

GetOptions(
  "db=s" => \$dbPath,
  "language=s" => \$languageFilter,
  "detail" => \$detailOpt,
  "outputFile=s"  => \$outputFile,
  "csv" => \$csvOpt,
  "help" => \$help,
);

# help message
die usage("") if ($help);

die usage("Please specify output json file\n") unless ($outputFile);

$| = 1;

# open the database
print "Parsing dependencies ...";
my $db=openDatabase($dbPath);
print "\rParsing dependencies Done\n";

#code body*******************************************************************

print "\rExtracting dependencies ...";

my @depends;
my @ents = $db->ents("~unresolved ~unknown");
my @references;
foreach my $ent (@ents) {
  next if($languageFilter && ($languageFilter ne $ent->language));
  foreach my $dep ($ent->depends()) {
    foreach my $ref ($dep->values()) {
      push @references, $ref;
    }
  }
}

foreach my $ref (@references) {
  next if($languageFilter && ($languageFilter ne $ref->language));
  my $dest_ref = get_ref($ref->ent); # the entity being referenced
  next unless $dest_ref;
  next if($languageFilter && ($languageFilter ne $dest_ref->language));
  push @depends, depend($ref, $dest_ref);
}

my %cached_refs;
sub get_ref {
  my ($ent) = @_;
  if (exists $cached_refs{$ent->id}) {
    return $cached_refs{$ent->id};
  } else {
    my $ref = $ent->ref("define,definein"); # the entity being referenced
    $cached_refs{$ent->id} = $ref;
    return $ref;
  }
}

print "\rExtracting dependencies Done\n";

print "Exporting depends ...";

my @variables;
my %hash_variables;
my @file_ents = $db->ents("file ~unresolved ~unknown");
my $index = 0;
foreach my $ent (sort { $a->id <=> $b->id } @file_ents) {
  next if($languageFilter && ($languageFilter ne $ent->language));
  push @variables, $ent->longname;
  $hash_variables{$ent->longname} = $index++;
}

print_depends_csv(@depends) if $csvOpt;
print_depends_json(@depends) unless $csvOpt;

print "\rExporting depends Done\n";

#end body********************************************************************
closeDatabase($db);


# subroutines

sub print_depends_json {
  my (@_depends) = @_;
  open(FILE,">$outputFile") || die("Couldn't write to output json file. $!");

  my $json = JSON::PP->new->ascii->pretty->allow_nonref;
  print FILE $json->encode(convert_to_hash(@_depends));
}

sub convert_to_hash {
  my (@_depends) = @_;
  my @cells = cells(@_depends);

  my %depends_hash = (
    'schemaVersion' => '2.0',
    'name' => name(),
    'variables' => \@variables,
    'cells' => \@cells
  );

  return \%depends_hash;
}

sub name {
  return basename($db->name());
}

sub cells {
  my (@_depends) = @_;
  my @cells;
  my %hash;

  foreach my $depend (@_depends) {
    my $key = $depend->{src}.'$'.$depend->{dest};
    my @details;
    if(exists $hash{$key}{details}) {
      @details = (@{$hash{$key}{details}}, map_depend($depend));
    } else {
      @details = map_depend($depend);
    }

    my %new_hash = (
      'src' => $depend->{src},
      'dest' => $depend->{dest},
      'details' => \@details
    );
    $hash{$key} = \%new_hash;
  }

  foreach my $key (keys %hash) {
    my %cell = (
      'src' => $hash_variables{$hash{$key}{src}},
      'dest' => $hash_variables{$hash{$key}{dest}},
      'values' => get_values(@{$hash{$key}{details}}),
    );

    if($detailOpt) {
      $cell{details} = $hash{$key}{details};
    }
    push @cells, \%cell;
  }

  return @cells;
}

sub map_depend {
  my ($depend) = @_;
  my %src = (
    'object' => $depend->{scope},
	'kind' => $depend->{scope_kind},
    'file' => $depend->{src},
#   'lineNumber' => $depend->{src_line},
#	'columnNumber' => $depend->{src_column}
  );
  my %dest = (
    'object' => $depend->{ent_name},
	'kind' => $depend->{ent_kind},
    'file' => $depend->{dest},
#   'lineNumber' => $depend->{dest_line},
#	'columnNumber' => $depend->{dest_column}
  );
  my %new_depend = (
    'src' => \%src,
    'dest' => \%dest,
    'type' => $depend->{kind}
  );

  return \%new_depend;
}

sub get_values {
  my (@details) = @_;
  my %values;
  foreach my $detail (@details) {
    if(exists $values{$detail->{type}}) {
      $values{$detail->{type}} += 1.0;
    } else {
      $values{$detail->{type}} = 1.0;
    }
  }
  return \%values;
}

sub depend {
  my ($ref, $dest_ref) = @_;
  my %depend = (
    'src' => $ref->file->longname,
#   'src_line' => $ref->line,
#	'src_column' => $ref->column,
    'dest' => $dest_ref->file->longname,
#   'dest_line' => $dest_ref->line,
#	'dest_column' => $dest_ref->column,
    'kind' => $ref->kindname,
    'ent_kind' => $ref->ent->kindname,
    'scope' => $ref->scope->longname,
	'scope_kind' => $ref->scope->kindname,
    'ent_name' => $ref->ent->longname,
  );
  return \%depend;
}

sub print_depends_csv {
  my (@_depends) = @_;
  open(FILE,">$outputFile") || die("Couldn't write to output json file. $!");
  print FILE "Src,Dest,Kind,Ent Kind,Scope,Ent Name,Src Line,Dest Line\n";
  my (@depend_keys) = ('src', 'dest', 'kind', 'ent_kind', 'scope', 'ent_name', 'src_line', 'dest_line');
  my ($delimiter) = ",";

  foreach my $depend (@_depends) {
    foreach my $key (@depend_keys) {
      print FILE $depend->{$key}.$delimiter;
    }
    print FILE "\n";
  }
}

sub openDatabase($)
{
    my ($dbPath) = @_;

    my $db = Understand::Gui::db();

    # path not allowed if opened by understand
    if ($db&&$dbPath) {
  die "database already opened by GUI, don't use -db option\n";
    }

    # open database if not already open
    if (!$db) {
  my $status;
  die usage("Error, database not specified\n\n") unless ($dbPath);
  ($db,$status)=Understand::open($dbPath);
  die "Error opening database: ",$status,"\n" if $status;
    }
    return($db);
}

sub closeDatabase($)
{
    my ($db)=@_;

    # close database only if we opened it
    $db->close() if $dbPath;
}